import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AiMark, Panel, Pill } from "@/components/bits";
import { useAppStore } from "@/lib/store";
import { startPushToTalk } from "@/lib/voice";
import { Mic, Square } from "lucide-react";

export const Route = createFileRoute("/copilot")({ component: Copilot });

const PROMPTS = [
  "Why is the third floor hot?",
  "Which zones are overridden?",
  "What changed after the chiller repair?",
  "What is due on AHU-2 this week?",
];

function Copilot() {
  const nav = useNavigate();
  const messages = useAppStore((s) => s.copilot);
  const ask = useAppStore((s) => s.askCopilot);
  const routing = useAppStore((s) => s.settings.routingMode);
  const points = useAppStore((s) => s.points);
  const [q, setQ] = useState("");
  const [listening, setListening] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    ask(t);
    setQ("");
  };

  const openCitation = (kind: string, id: string) => {
    if (kind === "point") {
      const p = points.find((x) => x.id === id);
      if (p) void nav({ to: "/assets/$id", params: { id: p.assetId } });
      return;
    }
    if (kind === "task") void nav({ to: "/tasks/$id", params: { id } });
    if (kind === "fault") void nav({ to: "/faults/$id", params: { id } });
    if (kind === "document") void nav({ to: "/documents" });
    if (kind === "asset") void nav({ to: "/assets/$id", params: { id } });
  };

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <header className="px-5 pb-3 pt-2">
        <p className="label-kicker">Operator copilot</p>
        <h1 className="text-[28px] font-medium tracking-tight">Ask the building</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Answers only from imported records. Observed facts are labeled apart from hypotheses. Routing: {routing}. Citations open the source.
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-3 px-5 pb-4">
        {messages.length === 0 && (
          <div className="grid gap-2">
            {PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => send(p)} className="press min-h-12 rounded-xl bg-card px-4 py-3.5 text-left text-sm shadow-[var(--shadow-border)]">{p}</button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "ml-8" : "mr-4"}>
            <Panel className={m.role === "user" ? "bg-card-2 px-4 py-3" : "px-4 py-3"}>
              {m.role === "assistant" && (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <AiMark label={m.aiLabel} />
                  <Pill tone={m.observedVsHypothesis === "observed" ? "ok" : m.observedVsHypothesis === "missing-source" ? "warn" : "muted"}>{m.observedVsHypothesis}</Pill>
                </div>
              )}
              <p className="text-sm leading-relaxed">{m.text}</p>
              {m.missingSource && <p className="mt-2 text-xs text-warn">Missing source: {m.missingSource}</p>}
              {m.citations.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {m.citations.map((c) => (
                    <li key={`${c.kind}-${c.id}`}>
                      <button type="button" onClick={() => openCitation(c.kind, c.id)} className="press w-full rounded-lg px-1 py-1.5 text-left text-[11px] text-muted">
                        {c.kind} · {c.label}{c.detail ? ` · ${c.detail}` : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        ))}
        <div className="mt-auto flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(q)}
            placeholder="Ask from this building’s records" className="h-12 flex-1 rounded-xl bg-card px-3 text-sm outline-none shadow-[var(--shadow-border)]" />
          <Button variant="quiet" className="size-12 p-0" aria-label="Dictate"
            onPointerDown={() => { setListening(true); stopRef.current = startPushToTalk((t) => { setQ(t); send(t); }, () => setListening(false)); }}
            onPointerUp={() => { stopRef.current?.(); setListening(false); }}>
            {listening ? <Square className="size-4" /> : <Mic className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
