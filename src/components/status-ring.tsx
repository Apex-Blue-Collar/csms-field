import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "bad";

export function StatusRing({
  label,
  sub,
  progress,
  tone,
  className,
}: {
  label: string;
  sub: string;
  progress: number;
  tone: Tone;
  className?: string;
}) {
  const p = Math.max(0.08, Math.min(1, progress));
  const stroke = tone === "ok" ? "#8aa389" : tone === "warn" ? "#c4a574" : "#c47a6a";
  const C = 2 * Math.PI * 54;
  const dash = `${C * p} ${C}`;

  return (
    <div className={cn("relative mx-auto grid place-items-center", className)}>
      <svg width="220" height="220" viewBox="0 0 160 160" className="overflow-visible" aria-hidden>
        <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(236,234,228,0.06)" strokeWidth="1" />
        <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(236,234,228,0.10)" strokeWidth="1" strokeDasharray="1.6 6.4" />
        <g className="orbit-spin">
          <circle cx="80" cy="6" r="2.4" fill="#eceae4" />
          <path d="M80 10 C 118 18, 142 46, 148 80" fill="none" stroke="rgba(236,234,228,0.45)" strokeWidth="0.8" />
        </g>
        <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(236,234,228,0.08)" strokeWidth="6" />
        <circle
          cx="80"
          cy="80"
          r="54"
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={dash}
          transform="rotate(-90 80 80)"
        />
        <circle cx="80" cy="80" r="36" fill="none" stroke="rgba(236,234,228,0.12)" strokeWidth="1" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const r1 = 70;
          const r2 = 74;
          const a = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={80 + r1 * Math.cos(a)}
              y1={80 + r1 * Math.sin(a)}
              x2={80 + r2 * Math.cos(a)}
              y2={80 + r2 * Math.sin(a)}
              stroke="rgba(236,234,228,0.28)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="label-kicker mb-1">Building</p>
        <p className="font-sans text-[28px] font-medium leading-none tracking-[-0.04em]">{label}</p>
        <p className="mt-2 max-w-[9.5rem] text-[12px] leading-snug text-muted">{sub}</p>
      </div>
    </div>
  );
}
