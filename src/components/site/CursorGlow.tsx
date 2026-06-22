import { useEffect, useRef } from "react";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const el = glowRef.current;
    if (!el) return;

    let x = -400;
    let y = -400;
    let currentX = -400;
    let currentY = -400;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const tick = () => {
      // Lerp for smooth trailing effect
      currentX += (x - currentX) * 0.12;
      currentY += (y - currentY) * 0.12;
      el.style.transform = `translate(${currentX - 250}px, ${currentY - 250}px)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    rafId = requestAnimationFrame(tick);
    el.style.opacity = "1";

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[9999] size-[500px] rounded-full opacity-0"
      style={{
        background:
          "radial-gradient(circle, oklch(0.80 0.085 84 / 0.07) 0%, oklch(0.80 0.085 84 / 0.025) 40%, transparent 70%)",
        willChange: "transform",
      }}
    />
  );
}
