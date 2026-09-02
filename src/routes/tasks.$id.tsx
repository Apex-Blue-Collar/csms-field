import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Divider, Panel, ScreenTitle, VoiceNoteCard } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { evidenceProgress } from "@/lib/engines";
import { useAppStore } from "@/lib/store";
import { speak, speechSupported, startPushToTalk } from "@/lib/voice";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/tasks/$id")({ component: TaskDetail });

function TaskDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const task = useAppStore((s) => s.tasks.find((t) => t.id === id));
  const start = useAppStore((s) => s.startTask);
  const next = useAppStore((s) => s.nextChecklistStep);
  const add = useAppStore((s) => s.addEvidence);
  const addReading = useAppStore((s) => s.addReading);
  const editVoice = useAppStore((s) => s.editVoiceNote);
  const createWo = useAppStore((s) => s.createWorkOrder);
  const setActive = useAppStore((s) => s.setActiveTask);
  const readBack = useAppStore((s) => s.readBack);
  const airplane = useAppStore((s) => s.settings.airplaneMode);
  const queued = useAppStore((s) => s.queue.filter((q) => !q.synced && q.recordId === id).length);
  const [listening, setListening] = useState(false);
  const [typedNote, setTypedNote] = useState("");
  const stopRef = useRef<(() => void) | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const readingValues = useRef<Record<string, string>>({});

  useEffect(() => { setActive(id); }, [id, setActive]);

  if (!task) return <p className="px-5 text-muted">Task not in this device.</p>;
  const remaining = task.evidence.checklist.filter((s) => !s.done).length;
  const current = task.evidence.checklist.find((s) => !s.done);
  const progress = evidenceProgress(task);
  const closed = progress.every((p) => p.done);

  const captureVoice = (text: string) => {
    const t = text.trim();
    if (!t) return;
    add(task.id, "voice", t);
    setTypedNote("");
    setListening(false);
  };

  const holdNote = () => {
    setListening(true);
    if (!speechSupported()) return;
    stopRef.current = startPushToTalk((t) => { if (t.trim()) captureVoice(t); }, () => setListening(false));
  };

  return (
    <div>
      <ScreenTitle kicker={task.status} title={task.title} />
      <div className="space-y-4 px-5 pb-8">
        <p className="text-sm leading-relaxed text-muted">{task.basis}</p>
        {(airplane || queued > 0) && (
          <button type="button" onClick={() => nav({ to: "/settings" })} className="press w-full rounded-xl bg-warn/10 px-4 py-3 text-left">
            <p className="text-sm font-medium text-warn">{airplane ? "Airplane mode — captures stay on this device." : `${queued} queued on this task`}</p>
            <p className="mt-1 text-xs text-muted">Photo, reading, and voice note survive reconnect. Conflict log never drops local evidence.</p>
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          {progress.map((p) => (
            <span key={p.kind} className={`rounded-full px-3 py-1.5 text-xs font-medium ${p.done ? "bg-ok/15 text-ok" : "bg-card-2 text-muted"}`}>
              {p.kind}{p.done ? " · in" : ""}
            </span>
          ))}
        </div>
        <Panel className="px-4 py-4">
          <p className="label-kicker">Safety</p>
          {task.safetyNotes.map((n) => <p key={n} className="mt-2 text-sm leading-relaxed">{n}</p>)}
          <Button variant="quiet" className="mt-3 w-full" onClick={() => speak(readBack(task.id))}>Read back</Button>
        </Panel>
        <Panel>
          {task.evidence.checklist.map((s, i) => (
            <div key={s.step}>
              {i > 0 && <Divider />}
              <p className={`px-4 py-3.5 text-sm leading-snug ${s.done ? "text-muted line-through" : current?.step === s.step ? "text-foreground" : ""}`}>
                <span className="mr-2 font-mono text-xs text-faint">{s.step}</span>{s.text}
              </p>
            </div>
          ))}
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="quiet" className="min-h-12" onClick={() => start(task.id)}>Start</Button>
          <Button className="min-h-12" onClick={() => next(task.id)}>{remaining ? "Next step" : "Complete"}</Button>
        </div>
        <Panel className="px-4 py-4">
          <p className="label-kicker">Required readings</p>
          {task.requiredReadings.map((r) => {
            const existing = task.evidence.readings.find((x) => x.name === r.name);
            return (
              <label key={r.name} className="mt-3 block">
                <span className="text-sm">{r.name} <span className="text-muted">({r.unit})</span></span>
                <input
                  defaultValue={existing?.value ?? ""}
                  inputMode="decimal"
                  placeholder="As-found"
                  onChange={(e) => { readingValues.current[r.name] = e.target.value; }}
                  className="mt-1.5 h-12 w-full rounded-xl bg-card-2 px-3 text-[15px] outline-none shadow-[var(--shadow-border)]"
                />
                <Button variant="quiet" className="mt-2 w-full" onClick={() => addReading(task.id, r.name, readingValues.current[r.name] ?? existing?.value ?? "", r.unit)}>
                  Save reading
                </Button>
              </label>
            );
          })}
        </Panel>
        <Panel className="px-4 py-4">
          <p className="label-kicker">Photos</p>
          <p className="mt-2 text-sm text-muted">{task.evidence.photos.length} captured. Camera if the phone allows it — otherwise a local marker is stored.</p>
          {task.evidence.photos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {task.evidence.photos.map((p) => (
                p.dataUrl
                  ? <img key={p.id} src={p.dataUrl} alt="Field photo" className="aspect-square w-full rounded-lg object-cover" />
                  : <div key={p.id} className="grid aspect-square place-items-center rounded-lg bg-card-2 text-[10px] text-muted">photo</div>
              ))}
            </div>
          )}
          <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) { add(task.id, "photo"); return; }
              const reader = new FileReader();
              reader.onload = () => add(task.id, "photo", String(reader.result ?? ""));
              reader.readAsDataURL(f);
            }} />
          <Button variant="quiet" className="mt-3 min-h-12 w-full" onClick={() => photoRef.current?.click()}>Take photo</Button>
        </Panel>
        <Panel className="px-4 py-4">
          <p className="label-kicker">Voice notes</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">Plant noise — hold close. Transcript is stored verbatim. Edits never overwrite the original.</p>
          <div className="mt-3 space-y-3">
            {task.evidence.voiceNotes.map((n) => (
              <VoiceNoteCard key={n.id} note={n} onEdit={(edited) => editVoice(task.id, n.id, edited)} />
            ))}
          </div>
          {listening && (
            <p className="mt-3 text-sm text-warn">Listening — speak the note, then release. Type below if the fans win.</p>
          )}
          <textarea value={typedNote} onChange={(e) => setTypedNote(e.target.value)} rows={3} placeholder="Type the note if speech is eaten by the plant"
            className="mt-3 w-full resize-none rounded-xl bg-card-2 px-3 py-2 text-sm outline-none shadow-[var(--shadow-border)]" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="quiet" className="min-h-12"
              onPointerDown={holdNote}
              onPointerUp={() => { stopRef.current?.(); stopRef.current = null; setListening(false); }}
              onPointerLeave={() => { stopRef.current?.(); setListening(false); }}>
              Hold to dictate
            </Button>
            <Button className="min-h-12" onClick={() => captureVoice(typedNote)}>Save note</Button>
          </div>
        </Panel>
        {closed && <p className="text-sm text-ok">Evidence gate closed: photo, reading, voice, checklist as required.</p>}
        <Button className="min-h-12 w-full" variant="quiet" onClick={() => { const wo = createWo({ fromTaskId: task.id }); nav({ to: "/work-orders/$id", params: { id: wo } }); }}>
          Create work order
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => nav({ to: "/assets/$id", params: { id: task.assetId } })}>Open asset</Button>
      </div>
    </div>
  );
}
