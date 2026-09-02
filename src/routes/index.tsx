import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Panel } from "@/components/bits";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Today });

function Today() {
  const nav = useNavigate();
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const buildings = useAppStore((s) => s.buildings);
  const tasks = useAppStore((s) => s.tasks);
  const faults = useAppStore((s) => s.faults);
  const queue = useAppStore((s) => s.queue);
  const conflicts = useAppStore((s) => s.conflicts);
  const airplane = useAppStore((s) => s.settings.airplaneMode);
  const mine = tasks.filter((t) => t.buildingId === buildingId);
  const due = mine.filter((t) => t.status === "due").length;
  const overdue = mine.filter((t) => t.status === "overdue").length;
  const cards = faults.filter((f) => f.buildingId === buildingId && f.adjudication === "open").length;
  const next = mine.find((t) => t.status !== "complete");
  const building = buildings.find((b) => b.id === buildingId);
  const pending = queue.filter((q) => !q.synced).length;
  const openConflicts = conflicts.filter((c) => c.resolution === "unresolved").length;
  const heat = overdue > 0 || cards > 0 ? (overdue > 0 ? 0.82 : 0.55) : 0.18;
  const label = overdue > 0 ? "Attention" : cards > 0 ? "Watch" : "Clear";
  const sub = overdue > 0 ? "Something needs a walk." : cards > 0 ? "Open cards, no overdue PM." : "No overdue PM on this floor.";
  const r = 96;
  const c = 2 * Math.PI * r;
  const dash = c * heat;

  return (
    <div className="flex flex-col items-center px-5 pb-6">
      <p className="label-kicker mt-4">Building</p>
      <h1 className="mt-1 text-center text-4xl font-medium tracking-tight">{label}</h1>
      <p className="mt-2 max-w-[16rem] text-center text-sm text-muted">{sub}</p>
      <div className="relative my-6 grid size-[220px] place-items-center">
        <svg viewBox="0 0 220 220" className="absolute inset-0 size-[220px] -rotate-90">
          <circle cx="110" cy="110" r={r} fill="none" stroke="currentColor" className="text-card-2" strokeWidth="10" />
          <circle cx="110" cy="110" r={r} fill="none" stroke="currentColor" className={overdue > 0 ? "text-warn" : "text-ok"} strokeWidth="10" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
        </svg>
        <div className="text-center">
          <p className="text-5xl font-medium tabular tracking-tight">{overdue || due}</p>
          <p className="label-kicker mt-1">{overdue ? "Overdue" : "Due"}</p>
        </div>
      </div>
      <div className="grid w-full grid-cols-3 gap-2">
        {([["Due", due], ["Overdue", overdue], ["Cards", cards]] as const).map(([k, v]) => (
          <Panel key={k} className="px-3 py-3 text-center">
            <p className="text-xl font-medium tabular">{v}</p>
            <p className="label-kicker mt-1">{k}</p>
          </Panel>
        ))}
      </div>
      {(airplane || pending > 0 || openConflicts > 0) && (
        <button type="button" onClick={() => nav({ to: "/settings" })} className="press mt-4 w-full rounded-xl bg-warn/10 px-4 py-3 text-left">
          <p className="text-sm font-medium text-warn">{airplane ? "Airplane mode — captures stay on device." : `${pending} queued · ${openConflicts} conflict${openConflicts === 1 ? "" : "s"}`}</p>
          <p className="mt-1 text-xs text-muted">Open the conflict log. Local evidence is kept.</p>
        </button>
      )}
      {next && (
        <button type="button" onClick={() => nav({ to: "/tasks/$id", params: { id: next.id } })} className="press mt-4 w-full rounded-2xl bg-card px-4 py-4 text-left shadow-[var(--shadow-border)]">
          <p className="label-kicker">Next</p>
          <p className="mt-1 text-lg font-medium">{next.title}</p>
          <p className="mt-1 text-xs text-muted">{next.status} · {next.dueAt.slice(0, 10)} · {building?.name}</p>
        </button>
      )}
      <button type="button" onClick={() => nav({ to: "/briefs" })} className="press mt-3 w-full rounded-2xl bg-card px-4 py-4 text-left shadow-[var(--shadow-border)]">
        <p className="label-kicker">Daily</p>
        <p className="mt-1 text-[15px] font-medium">Export today’s brief</p>
        <p className="mt-1 text-xs text-muted">Due, overdue, cards, quality — one file for the shift.</p>
      </button>
    </div>
  );
}
