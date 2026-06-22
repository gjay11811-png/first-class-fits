import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchProducts } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { Countdown } from "@/components/site/Countdown";
import { ArrowRight, Star, Truck, ShieldCheck, RefreshCw, Sparkles, Package, Award } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { AnimateIn, StaggerContainer, fadeUpItem, RevealImage } from "@/components/site/AnimateIn";
import { MagneticButton } from "@/components/site/MagneticButton";
import heroHermes from "@/assets/hero-hermes-shorts.jpg";

const homeFaq = [
  { q: "When will my order ship?", a: "Standard orders dispatch within 48 hours. Limited drops may take up to 5 business days." },
  { q: "Do you ship internationally?", a: "Yes. We ship from the UK with tracked priority delivery. Same service for the US. Duties calculated at checkout." },
  { q: "What is your returns policy?", a: "Free 30-day returns on full-price items in original condition. Sale items can be exchanged within 14 days." },
  { q: "Are your products authentic?", a: "Every item undergoes a triple-stage verification. NFC chips embedded in footwear and electronics verify ledger entry." },
  { q: "How do I track my order?", a: "You'll receive an email with a tracking link as soon as your order dispatches. Sign in to your account to track all orders." },
];

const DESIGNER_BRANDS = [
  "Gucci", "Off-White", "Moncler", "Stone Island", "Burberry",
  "Balenciaga", "Prada", "Dior", "Saint Laurent", "Bottega Veneta",
  "Canada Goose", "Palm Angels",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "First Class Fits — Designer fashion, watches, footwear & tech" },
      { name: "description", content: "Curated designer fashion, luxury watches, premium footwear, sportswear and lifestyle electronics. Free UK shipping over £120. Same for US over £150." },
      { property: "og:title", content: "First Class Fits — Designer fashion, watches, footwear & tech" },
      { property: "og:description", content: "Curated designer fashion, luxury watches, premium footwear, sportswear and electronics." },
      { property: "og:url", content: "https://firstclassfits.co/" },
      { property: "og:image", content: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1600&q=80" },
      { name: "twitter:image", content: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1600&q=80" },
    ],
    links: [{ rel: "canonical", href: "https://firstclassfits.co/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: homeFaq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    }],
  }),
  component: Home,
});

// ── Count-up number ────────────────────────────────────────────────────────
function CountUp({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ── Hero ───────────────────────────────────────────────────────────────────
function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-[94vh] flex items-end overflow-hidden">
      {/* Parallax + ken-burns background */}
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        <motion.img
          src={heroHermes}
          alt="Featured drop"
          className="size-full object-cover"
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
        {/* film grain */}
        <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "256px" }} />
      </motion.div>

      {/* gold ambient glow */}
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.80 0.085 84 / 0.07) 0%, transparent 65%)", transform: "translate(-25%, 30%)" }} />

      <motion.div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-24" style={{ y: contentY, opacity }}>
        {/* Eyebrow */}
        <motion.div
          className="flex items-center gap-3 mb-7"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="w-10 h-px bg-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">Season 04 — The Edit</span>
        </motion.div>

        {/* Serif editorial headline */}
        <h1 className="font-serif text-6xl sm:text-8xl md:text-[9rem] leading-[0.92] tracking-tight max-w-5xl font-light">
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 50, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Elevate your
          </motion.span>
          <motion.span
            className="block italic text-gold-gradient"
            initial={{ opacity: 0, y: 50, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            standard.
          </motion.span>
        </h1>

        <motion.p
          className="mt-7 max-w-md text-base sm:text-lg text-foreground/70 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          Designer apparel, Swiss-grade timepieces, premium footwear and lifestyle technology — authenticated and curated weekly.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
        >
          <MagneticButton to="/shop">
            <span className="group flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-[0.2em] hover:brightness-105 transition-all duration-200">
              Shop the edit
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </MagneticButton>
          <Link to="/shop" search={{ sort: "new" } as never} className="group text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
            <span className="border-b border-primary/40 group-hover:border-primary pb-1 transition-colors">New arrivals</span>
          </Link>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="mt-16 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-foreground/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <motion.div className="w-px h-10 bg-foreground/25" animate={{ scaleY: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} style={{ transformOrigin: "top" }} />
          Discover
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Designer brand marquee ──────────────────────────────────────────────────
function BrandMarquee() {
  return (
    <section className="border-y border-border bg-surface/30 py-7 overflow-hidden">
      <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">
        The houses we carry
      </p>
      <div className="relative flex overflow-hidden">
        <div className="flex shrink-0 items-center animate-marquee whitespace-nowrap">
          {[...DESIGNER_BRANDS, ...DESIGNER_BRANDS].map((b, i) => (
            <span key={i} className="font-serif text-2xl sm:text-3xl text-foreground/40 hover:text-primary transition-colors duration-300 px-8 sm:px-12">
              {b}
            </span>
          ))}
        </div>
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
    </section>
  );
}

// ── Stats bar ──────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { icon: Package, value: 2400, suffix: "+", label: "Orders delivered" },
    { icon: Award, value: 100, suffix: "%", label: "Authenticated" },
    { icon: ShieldCheck, value: 48, suffix: "h", label: "Avg. dispatch" },
    { icon: Star, value: 4800, suffix: "+", label: "Members worldwide" },
  ];
  return (
    <StaggerContainer className="border-b border-border" stagger={0.1} delayStart={0.1}>
      <div className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUpItem} className="flex flex-col items-center text-center gap-2">
            <s.icon className="size-5 text-primary mb-1" strokeWidth={1.5} />
            <span className="font-serif text-4xl sm:text-5xl text-foreground">
              <CountUp target={s.value} suffix={s.suffix} />
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </StaggerContainer>
  );
}

// ── Trust strip ────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: Truck, text: "Free UK shipping over £120 / US £150" },
    { icon: ShieldCheck, text: "Secure 256-bit checkout" },
    { icon: RefreshCw, text: "30-day returns" },
    { icon: Sparkles, text: "Authenticated drops" },
  ];
  return (
    <StaggerContainer className="border-b border-border bg-surface/40" stagger={0.07}>
      <div className="max-w-[1400px] mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <motion.div key={item.text} variants={fadeUpItem} className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.12em] text-foreground/75">
            <item.icon className="size-4 text-primary shrink-0" strokeWidth={1.5} />
            {item.text}
          </motion.div>
        ))}
      </div>
    </StaggerContainer>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title, viewAll }: { eyebrow?: string; title: string; viewAll?: boolean }) {
  return (
    <AnimateIn className="flex items-end justify-between mb-12" blur={false}>
      <div>
        {eyebrow && (
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-px bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">{eyebrow}</span>
          </div>
        )}
        <h2 className="font-serif text-4xl sm:text-5xl tracking-tight font-light">{title}</h2>
      </div>
      {viewAll && (
        <Link to="/shop" className="hidden sm:inline-flex text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors items-center gap-2 group">
          View all <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </AnimateIn>
  );
}

// ── Product rail ───────────────────────────────────────────────────────────
function ProductRail({ eyebrow, title, products, badge }: {
  eyebrow?: string;
  title: string;
  products: Awaited<ReturnType<typeof fetchProducts>>;
  badge?: string;
}) {
  return (
    <section className="py-20 sm:py-28 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6">
        <SectionHeading eyebrow={eyebrow} title={title} viewAll />
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-12" stagger={0.08}>
          {products.map((p) => <ProductCard key={p.id} product={p} badge={badge} />)}
          {products.length === 0 && Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} variants={fadeUpItem} className="aspect-[3/4] bg-surface animate-shimmer" />
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ── Limited drop ───────────────────────────────────────────────────────────
function LimitedDropSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] rounded-full"
          style={{ background: "radial-gradient(ellipse, oklch(0.80 0.085 84 / 0.10) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        />
      </div>
      <div className="relative z-10 border-y border-primary/20">
        <div className="max-w-[1400px] mx-auto px-6 py-20 sm:py-28 text-center">
          <AnimateIn>
            <div className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 border border-primary/40 text-primary text-[10px] font-bold uppercase tracking-[0.3em]">
              <motion.span className="size-1.5 rounded-full bg-primary" animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
              Live now
            </div>
            <p className="font-display text-xs uppercase tracking-[0.35em] text-foreground/50 mb-4">The Blackout Drop</p>
            <h2 className="font-serif text-6xl sm:text-8xl tracking-tight font-light mb-12">Ends in</h2>
          </AnimateIn>
          <AnimateIn delay={0.15} blur={false}>
            <div className="flex justify-center mb-12">
              <Countdown hours={9} />
            </div>
          </AnimateIn>
          <AnimateIn delay={0.25} className="flex justify-center">
            <MagneticButton to="/shop" search={{ sale: "1" }}>
              <span className="group inline-flex items-center gap-3 px-12 py-5 bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-[0.25em] hover:brightness-105 transition-all duration-200">
                Shop the drop
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </MagneticButton>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

// ── Featured collections ────────────────────────────────────────────────────
function FeaturedCollections() {
  return (
    <section className="py-20 sm:py-28 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6">
        <SectionHeading eyebrow="Curated" title="The collections" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimateIn direction="left" delay={0.1}>
            <Link to="/shop" search={{ category: "footwear" } as never} className="relative block aspect-[4/5] md:h-[560px] overflow-hidden group">
              <RevealImage
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&q=80"
                alt="Premium technical footwear"
                className="absolute inset-0"
                imgClassName="size-full object-cover group-hover:scale-105 transition-transform duration-[1.2s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent p-10 flex flex-col justify-end z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">Footwear & Trainers</p>
                <h3 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">The Footwear Lab</h3>
                <p className="text-sm text-foreground/70 max-w-xs mt-3">Smart trainers and high-fashion silhouettes, performance-engineered.</p>
                <span className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary inline-flex items-center gap-2 group-hover:gap-3 transition-all">Explore <ArrowRight className="size-3" /></span>
              </div>
            </Link>
          </AnimateIn>
          <div className="grid grid-rows-2 gap-5">
            <AnimateIn direction="right" delay={0.15}>
              <Link to="/shop" search={{ category: "electronics" } as never} className="relative block overflow-hidden group h-full min-h-[270px]">
                <RevealImage
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1400&q=80"
                  alt="Luxury watches and timepieces"
                  className="absolute inset-0"
                  imgClassName="size-full object-cover group-hover:scale-105 transition-transform duration-[1.2s]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 to-transparent p-8 flex flex-col justify-end z-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Timepieces & Tech</p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-light tracking-tight">Watches & Smart Tech</h3>
                </div>
              </Link>
            </AnimateIn>
            <AnimateIn direction="right" delay={0.22}>
              <Link to="/shop" search={{ category: "mens-fashion" } as never} className="relative block overflow-hidden group h-full min-h-[270px]">
                <RevealImage
                  src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1400&q=80"
                  alt="Designer outerwear"
                  className="absolute inset-0"
                  imgClassName="size-full object-cover group-hover:scale-105 transition-transform duration-[1.2s]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 to-transparent p-8 flex flex-col justify-end z-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Apparel</p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-light tracking-tight">Designer Outerwear</h3>
                </div>
              </Link>
            </AnimateIn>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Reviews ─────────────────────────────────────────────────────────────────
function ReviewsSection() {
  const reviews = [
    { name: "Marcus V.", role: "Verified Collector", body: "The attention to detail on the seams and technical waterproofing is genuine first-class quality.", rating: 5 },
    { name: "Elena G.", role: "Archival Specialist", body: "Finally a brand that understands luxury isn't about logos — it's about material science and silhouette.", rating: 5 },
    { name: "Julian R.", role: "Creative Director", body: "The watch selection rivals dedicated horology boutiques. Aesthetic and provenance in perfect balance.", rating: 5 },
  ];
  const directions: ("left" | "up" | "right")[] = ["left", "up", "right"];
  return (
    <section className="bg-surface/50 py-24 sm:py-28 border-y border-border">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimateIn className="text-center mb-14" blur={false}>
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Testimonials</span>
            <span className="w-8 h-px bg-primary" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">The verdict</h2>
        </AnimateIn>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <AnimateIn key={i} direction={directions[i]} delay={i * 0.1}>
              <div className="p-8 border border-border bg-background hover:border-primary/30 transition-colors duration-300 h-full">
                <div className="flex gap-0.5 text-primary mb-5">
                  {Array.from({ length: r.rating }).map((_, k) => <Star key={k} className="size-4 fill-current" />)}
                </div>
                <p className="font-serif text-xl leading-relaxed mb-7 italic text-foreground/90">"{r.body}"</p>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-surface-elevated border border-primary/20" />
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.role} <span className="ml-1 text-primary">✓ Verified</span></p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Instagram ───────────────────────────────────────────────────────────────
function InstagramGallery() {
  const imgs = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
    "https://images.unsplash.com/photo-1485518882345-15568b007407?w=600&q=80",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  ];
  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimateIn className="flex items-baseline justify-between mb-8" blur={false}>
          <h3 className="font-serif text-2xl font-light">@firstclassfits</h3>
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Tagged in 4.2k posts</span>
        </AnimateIn>
        <StaggerContainer className="grid grid-cols-3 md:grid-cols-6 gap-2" stagger={0.06}>
          {imgs.map((src, i) => (
            <motion.a
              key={i}
              variants={fadeUpItem}
              href="https://www.instagram.com/firstclassfits"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`First Class Fits Instagram post ${i + 1}`}
              className="block aspect-square overflow-hidden group relative"
              whileHover={{ scale: 1.02 }}
            >
              <img src={src} alt={`Instagram post ${i + 1}`} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
            </motion.a>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────────
function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-t border-border py-24" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateIn className="text-center mb-12" blur={false}>
          <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">Common questions</h2>
        </AnimateIn>
        <div className="divide-y divide-border border-y border-border">
          {homeFaq.map((it, i) => (
            <AnimateIn key={i} delay={i * 0.05} blur={false}>
              <div className="py-6">
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-center text-left gap-4 group">
                  <span className="font-serif text-lg group-hover:text-primary transition-colors">{it.q}</span>
                  <motion.span className="text-primary text-2xl shrink-0 font-light" animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }}>+</motion.span>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden text-sm text-muted-foreground leading-relaxed mt-4"
                    >
                      {it.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Home ────────────────────────────────────────────────────────────────────
function Home() {
  const trending = useQuery({ queryKey: ["products", { trending: true }], queryFn: () => fetchProducts({ trending: true, limit: 8 }) });
  const newArrivals = useQuery({ queryKey: ["products", "new"], queryFn: () => fetchProducts({ limit: 4 }) });
  const bestSellers = useQuery({ queryKey: ["products", { best: true }], queryFn: () => fetchProducts({ bestSeller: true, limit: 4 }) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  return (
    <div>
      <HeroSection />
      <BrandMarquee />
      <StatsBar />
      <TrustStrip />

      {/* Category rail */}
      <section className="py-14 border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6">
          <StaggerContainer className="flex overflow-x-auto gap-4 no-scrollbar" stagger={0.06}>
            {categories.data?.map((c) => (
              <motion.div key={c.id} variants={fadeUpItem}>
                <Link
                  to="/shop"
                  search={{ category: c.slug } as never}
                  className="flex-none w-44 aspect-square bg-surface grid place-items-center group cursor-pointer border border-border hover:border-primary transition-colors duration-300"
                >
                  <span className="font-serif text-lg text-center px-3 group-hover:text-primary transition-colors duration-300">{c.name}</span>
                </Link>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <ProductRail eyebrow="In demand" title="Trending now" products={trending.data ?? []} />
      <LimitedDropSection />
      <ProductRail eyebrow="Just landed" title="New arrivals" products={newArrivals.data ?? []} badge="New" />
      <FeaturedCollections />
      <ProductRail eyebrow="Most wanted" title="Best sellers" products={bestSellers.data ?? []} />
      <ReviewsSection />
      <InstagramGallery />
      <FaqSection />
    </div>
  );
}
