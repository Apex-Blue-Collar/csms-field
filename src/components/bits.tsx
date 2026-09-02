import { cn } from "@/lib/utils";
import type { VoiceNote } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("label-kicker", className)}>{children}</p>;
}

export function ScreenTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <header className="px-5 pb-3 pt-2">
      <p className="label-kicker">{kicker}</p>
      <h1 className="mt-1 text-3xl font-medium tracking-tight">{title}</h1>
    </header>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]", className)}>{children}</div>;
}

export function Divider() {
  return <div className="h-px bg-border" />;
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "ok" | "warn" | "bad" | "muted" }) {
  const c = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-muted";
  return <span className={cn("text-xs font-medium", c)}>{children}</span>;
}

export function AiMark({ label }: { label: string }) {
  const tone = label === "approved" || label === "human" ? "ok" : label === "rejected" ? "bad" : "warn";
  return <Pill tone={tone}>{label}</Pill>;
}

export function Row({
  title, meta, onClick, trailing,
}: { title: string; meta?: string; onClick?: () => void; trailing?: ReactNode }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp type={onClick ? "button" : undefined} onClick={onClick} className={cn("flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left", onClick && "press")}>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium leading-tight">{title}</span>
        {meta ? <span className="mt-0.5 block truncate text-xs text-muted">{meta}</span> : null}
      </span>
      {trailing ?? (onClick ? <ChevronRight className="size-4 text-faint" /> : null)}
    </Comp>
  );
}

export function VoiceNoteCard({
  note,
  onEdit,
}: {
  note: VoiceNote;
  onEdit: (edited: string) => void;
}) {
  const [draft, setDraft] = useState(note.editedTranscript);
  const dirty = draft !== note.editedTranscript;
  return (
    <div className="rounded-xl bg-card-2 px-3 py-3">
      <p className="label-kicker">{note.offline ? "Verbatim · offline" : "Verbatim"}</p>
      <p className="mt-1 text-sm leading-snug">{note.originalTranscript || "—"}</p>
      <label className="mt-3 block">
        <span className="label-kicker">Edited copy · original stays</span>
        <textarea
          value={draft}
          rows={3}
          onChange={(e) => setDraft(e.target.value)}
          className="mt-1.5 w-full resize-none rounded-lg bg-card px-3 py-2 text-sm outline-none shadow-[var(--shadow-border)]"
        />
      </label>
      {dirty && (
        <button type="button" className="press mt-2 min-h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground" onClick={() => onEdit(draft)}>
          Save edit
        </button>
      )}
    </div>
  );
}
