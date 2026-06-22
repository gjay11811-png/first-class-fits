import { useEffect, useState } from "react";

export function Countdown({ hours = 24 }: { hours?: number }) {
  const [end] = useState(() => Date.now() + hours * 3600 * 1000);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, end - now);
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff / 60000) % 60)).padStart(2, "0");
  const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");

  const Unit = ({ value, label }: { value: string; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="relative min-w-[3.5rem] sm:min-w-[5rem] px-3 sm:px-5 py-3 sm:py-4 border border-primary/30 bg-surface/40 backdrop-blur-sm">
        <span className="font-serif text-4xl sm:text-6xl tabular-nums text-foreground leading-none">{value}</span>
        <span className="absolute top-1 left-1 size-1 border-t border-l border-primary/50" />
        <span className="absolute bottom-1 right-1 size-1 border-b border-r border-primary/50" />
      </div>
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div className="flex items-start gap-3 sm:gap-5">
      <Unit value={h} label="Hours" />
      <span className="font-serif text-3xl sm:text-5xl text-primary/40 pt-2 sm:pt-3">:</span>
      <Unit value={m} label="Mins" />
      <span className="font-serif text-3xl sm:text-5xl text-primary/40 pt-2 sm:pt-3">:</span>
      <Unit value={s} label="Secs" />
    </div>
  );
}
