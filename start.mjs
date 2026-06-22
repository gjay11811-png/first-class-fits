import { createServer } from "node:http";
import { existsSync, createReadStream, statSync } from "node:fs";
import { join, normalize, extname } from "node:path";

const CLIENT_DIR = normalize(join(process.cwd(), "dist", "client"));

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

// Serve a static file from dist/client if the request path maps to one.
// Returns true if it handled the request, false to fall through to SSR.
function tryServeStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const decoded = decodeURIComponent(pathname);
  const filePath = normalize(join(CLIENT_DIR, decoded));
  // Block path traversal outside dist/client
  if (!filePath.startsWith(CLIENT_DIR)) return false;
  if (!existsSync(filePath)) return false;
  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;

  const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
  res.statusCode = 200;
  res.setHeader("content-type", type);
  // Hashed asset filenames are immutable — cache hard. Other files: short cache.
  if (filePath.includes(join(CLIENT_DIR, "assets"))) {
    res.setHeader("cache-control", "public, max-age=31536000, immutable");
  } else {
    res.setHeader("cache-control", "public, max-age=3600");
  }
  if (req.method === "HEAD") {
    res.end();
    return true;
  }
  createReadStream(filePath).pipe(res);
  return true;
}

console.log("BOOT: start.mjs is running");
console.log("BOOT: cwd =", process.cwd());
console.log("BOOT: PORT env =", process.env.PORT);

const port = parseInt(process.env.PORT || "3000", 10);

const serverPath = "./dist/server/server.js";
console.log("BOOT: dist/server/server.js exists?", existsSync(serverPath));

let handler;
try {
  console.log("BOOT: importing server module...");
  ({ default: handler } = await import(serverPath));
  console.log("BOOT: server module imported OK");
} catch (err) {
  console.error("FATAL: could not load ./dist/server/server.js — did the build run?");
  console.error(err);
  process.exit(1);
}

const server = createServer(async (req, res) => {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const url = new URL(req.url || "/", `${protocol}://${host}`);

    // Serve static client assets (CSS/JS/images) directly; otherwise SSR.
    if (tryServeStatic(req, res, url.pathname)) return;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else if (value) headers.set(key, value);
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const request = new Request(url, {
      method: req.method || "GET",
      headers,
      body: hasBody ? req : null,
      duplex: "half",
    });

    const response = await handler.fetch(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => console.log(`Listening on 0.0.0.0:${port}`));
