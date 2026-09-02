import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Panel, Row, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { dailyBrief, simplePdf } from "@/lib/engines";
import { useAppStore } from "@/lib/store";
import { downloadBlob } from "@/lib/utils";

export const Route = createFileRoute("/briefs")({ component: Briefs });

function Briefs() {
  const nav = useNavigate();
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const buildings = useAppStore((s) => s.buildings);
  const tasks = useAppStore((s) => s.tasks).filter((t) => t.buildingId === buildingId);
  const quality = useAppStore((s) => s.quality).filter((q) => q.buildingId === buildingId);
  const cards = useAppStore((s) => s.faults).filter((f) => f.buildingId === buildingId && f.adjudication === "open");
  const queue = useAppStore((s) => s.queue);
  const conflicts = useAppStore((s) => s.conflicts);
  const wos = useAppStore((s) => s.workOrders).filter((w) => w.buildingId === buildingId && w.status !== "adjudicated");
  const log = useAppStore((s) => s.log);
  const due = tasks.filter((t) => t.status === "due");
  const overdue = tasks.filter((t) => t.status === "overdue");
  const building = buildings.find((b) => b.id === buildingId);
  const text = dailyBrief({
    buildingName: building?.name ?? "Building",
    due,
    overdue,
    quality,
    cards,
    queued: queue.filter((q) => !q.synced).length,
    conflicts: conflicts.filter((c) => c.resolution === "unresolved").length,
    workOrders: wos.map((w) => ({ id: w.id, equipmentName: w.equipmentName, status: w.status })),
  });

  const exportTxt = () => {
    downloadBlob(`brief-${buildingId}-${new Date().toISOString().slice(0, 10)}.txt`, "text/plain", text);
    log({ kind: "export", summary: "Exported daily brief (text)", payload: { buildingId } });
  };
  const exportPdf = () => {
    downloadBlob(`brief-${buildingId}.pdf`, "application/pdf", simplePdf(`Daily brief — ${building?.name}`, text.split("\n")));
    log({ kind: "export", summary: "Exported daily brief (PDF)", payload: { buildingId } });
  };

  return (
    <div>
      <ScreenTitle kicker="Shift package" title="Briefs" />
      <div className="space-y-4 px-5 pb-8">
        <p className="text-sm text-muted">One file for the walk. Due, overdue, open cards, and quality — no invented thresholds.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={exportTxt}>Export text</Button>
          <Button variant="quiet" onClick={exportPdf}>Export PDF</Button>
        </div>
        <Panel>
          <p className="px-4 pt-3 label-kicker">Overdue</p>
          {overdue.length === 0 && <p className="px-4 py-3 text-sm text-muted">None.</p>}
          {overdue.map((t) => (
            <Row key={t.id} title={t.title} meta={t.dueAt.slice(0, 10)} onClick={() => nav({ to: "/tasks/$id", params: { id: t.id } })} />
          ))}
        </Panel>
        <Panel>
          <p className="px-4 pt-3 label-kicker">Due</p>
          {due.map((t) => (
            <Row key={t.id} title={t.title} meta={t.dueAt.slice(0, 10)} onClick={() => nav({ to: "/tasks/$id", params: { id: t.id } })} />
          ))}
        </Panel>
        <Panel>
          <p className="px-4 pt-3 label-kicker">Open cards</p>
          {cards.map((c) => (
            <Row key={c.id} title={c.title} onClick={() => nav({ to: "/faults/$id", params: { id: c.id } })} />
          ))}
        </Panel>
        <Panel>
          <p className="px-4 pt-3 label-kicker">Open work orders</p>
          {wos.length === 0 && <p className="px-4 py-3 text-sm text-muted">None.</p>}
          {wos.map((w) => (
            <Row key={w.id} title={w.equipmentName || w.symptom} meta={w.status} onClick={() => nav({ to: "/work-orders/$id", params: { id: w.id } })} />
          ))}
        </Panel>
        <Panel>
          <p className="px-4 pt-3 label-kicker">Quality</p>
          {quality.map((q) => (
            <Row key={q.id} title={q.message} meta={q.kind} />
          ))}
        </Panel>
        <Panel className="px-4 py-4">
          <p className="label-kicker">Preview</p>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted">{text}</pre>
        </Panel>
      </div>
    </div>
  );
}
