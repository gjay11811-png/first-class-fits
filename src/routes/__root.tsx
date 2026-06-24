import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { CursorGlow } from "@/components/site/CursorGlow";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold uppercase tracking-tight">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center bg-primary px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try refreshing or go home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="bg-primary px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">Try again</button>
          <a href="/" className="border border-border px-5 py-3 text-[11px] font-bold uppercase tracking-widest">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "First Class Fits — Premium fashion, footwear & tech" },
      { name: "description", content: "First Class Fits — premium fashion, footwear, sportswear, electronics and accessories. Free shipping over £100." },
      { name: "author", content: "First Class Fits" },
      { name: "theme-color", content: "#1a1612" },
      { property: "og:site_name", content: "First Class Fits" },
      { property: "og:title", content: "First Class Fits — Premium fashion, footwear & tech" },
      { property: "og:description", content: "Elevated apparel, premium timepieces, considered footwear and lifestyle tech — curated weekly." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://firstclassfits.co/" },
      { property: "og:image", content: "https://firstclassfits.co/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "First Class Fits — premium fashion, footwear & tech" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "First Class Fits — Premium fashion, footwear & tech" },
      { name: "twitter:description", content: "Elevated apparel, timepieces, footwear and lifestyle tech — curated weekly." },
      { name: "twitter:image", content: "https://firstclassfits.co/og-image.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "icon", type: "image/png", href: "/icon-512.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://firstclassfits.co/#org",
              name: "First Class Fits",
              url: "https://firstclassfits.co",
              logo: "https://firstclassfits.co/icon-512.png",
              sameAs: ["https://www.instagram.com/firstclassfits"],
            },
            {
              "@type": "WebSite",
              "@id": "https://firstclassfits.co/#website",
              url: "https://firstclassfits.co",
              name: "First Class Fits",
              publisher: { "@id": "https://firstclassfits.co/#org" },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://firstclassfits.co/shop?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <SmoothScroll />
        <CursorGlow />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <CartDrawer />
        <Toaster theme="dark" position="bottom-right" />
      </CartProvider>
    </QueryClientProvider>
  );
}
