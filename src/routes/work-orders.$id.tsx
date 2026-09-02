import { createFileRoute } from "@tanstack/react-router";
import { Panel, ScreenTitle, VoiceNoteCard } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { simplePdf, workOrderCsv, workOrderExportRows } from "@/lib/engines";
import { useAppStore } from "@/lib/store";
import { downloadBlob } from "@/lib/utils";
import { speechSupported, startPushToTalk } from "@/lib/voice";
import { useRef, useState } from "react";

export const Route = createFileRoute("/work-orders/$id")({ component: WoDetail });

function WoDetail() {
  const { id } = Route.useParams();
  const wo = useAppStore((s) => s.workOrders.find((w) => w.id === id));
  const mark = useAppStore((s) => s.markExported);
  const addNote = useAppStore((s) => s.addWorkOrderNote);
  const editNote = useAppStore((s) => s.editWorkOrderNote);
  const airplane = useAppStore((s) => s.settings.airplaneMode);
  const [typed, setTyped] = useState("");
  const [listening, setListening] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  if (!wo) return <p className="px-5 text-muted">Work order not found.</p>;
  const body = [
    `Equipment: ${wo.equipmentName}`,
    `Location: ${wo.location}`,
    `Trade: ${wo.trade}`,
    "",
    "Symptom",
    wo.symptom,
    "",
    "Evidence",
    wo.evidence,
    "",
    "Probable cause",
    wo.probableCause || "—",
    "",
    "Safety",
    wo.safetyNotes,
    "",
    "Verification",
    wo.verificationTest,
    "",
    "No BMS write. Existing controllers keep the building.",
  ].join("\n");

  const exportCsv = () => {
    downloadBlob(`${wo.id}.csv`, "text/csv", workOrderCsv(workOrderExportRows([wo])));
    mark(wo.id);
  };
  const exportJson = () => {
    downloadBlob(`${wo.id}.json`, "application/json", JSON.stringify({ ...wo, notes: wo.notes }, null, 2));
    mark(wo.id);
  };
  const exportPdf = () => {
    downloadBlob(`${wo.id}.pdf`, "application/pdf", simplePdf(wo.equipmentName, body.split("\n")));
    mark(wo.id);
  };

  const capture = (text: string) => {
    const t = text.trim();
    if (!t) return;
    addNote(wo.id, t);
    setTyped("");
    setListening(false);
  };

  return (
    <div>
      <ScreenTitle kicker={wo.status} title={wo.equipmentName || "Field order"} />
      <div className="space-y-3 px-5 pb-8">
        {airplane && <p className="rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">Airplane mode. Dictated notes stay on this device until sync.</p>}
        <Panel className="whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed">{body}</Panel>
        <p className="text-xs text-muted">{wo.createdAt} · CMMS-ready · no BMS write</p>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="quiet" className="min-h-12" onClick={exportJson}>JSON</Button>
          <Button variant="quiet" className="min-h-12" onClick={exportCsv}>CSV</Button>
          <Button variant="quiet" className="min-h-12" onClick={exportPdf}>PDF</Button>
        </div>
        <Panel className="px-4 py-4">
          <p className="label-kicker">Hands-free notes</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">Dictate in airplane mode. Original transcript is kept. Edit the copy only.</p>
          <div className="mt-3 space-y-3">
            {wo.notes.map((n) => (
              <VoiceNoteCard key={n.id} note={n} onEdit={(edited) => editNote(wo.id, n.id, edited)} />
            ))}
          </div>
          {listening && <p className="mt-3 text-sm text-warn">Listening — hold close. Type if the plant is loud.</p>}
          <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={3} placeholder="Type the note if speech fails"
            className="mt-3 w-full resize-none rounded-xl bg-card-2 px-3 py-2 text-sm outline-none shadow-[var(--shadow-border)]" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="quiet" className="min-h-12"
              onPointerDown={() => {
                setListening(true);
                if (!speechSupported()) return;
                stopRef.current = startPushToTalk((t) => { if (t.trim()) capture(t); }, () => setListening(false));
              }}
              onPointerUp={() => { stopRef.current?.(); stopRef.current = null; setListening(false); }}>
              Hold to dictate
            </Button>
            <Button className="min-h-12" onClick={() => capture(typed)}>Save note</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
