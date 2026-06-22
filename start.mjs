import { createServer } from "node:http";

const port = parseInt(process.env.PORT || "3000", 10);

let handler;
try {
  ({ default: handler } = await import("./dist/server/server.js"));
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
