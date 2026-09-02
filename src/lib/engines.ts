import {
  PASSPORT_FIELDS,
  type Citation,
  type CopilotMessage,
  type EvidenceKind,
  type EvidencePassport,
  type FaultCard,
  type Point,
  type PriorityBreakdown,
  type PriorityWeights,
  type RoutingMode,
  type VoiceNote,
  type WorkOrder,
} from "./types.ts";
import { uid } from "./utils.ts";

/** Scoring is weight math only. No HVAC thresholds live here. */
export function scoreFault(flags: PriorityBreakdown, weights: PriorityWeights): number {
  return (
    flags.lifeSafety * weights.lifeSafety +
    flags.comfortIaq * weights.comfortIaq +
    flags.energy * weights.energy +
    flags.wear * weights.wear +
    flags.confidence * weights.confidence +
    flags.ease * weights.ease +
    flags.classification * weights.classification
  );
}

export function scoreLines(flags: PriorityBreakdown, weights: PriorityWeights) {
  return [
    { key: "Life safety / protection", flag: flags.lifeSafety, weight: weights.lifeSafety, part: flags.lifeSafety * weights.lifeSafety },
    { key: "Comfort / IAQ", flag: flags.comfortIaq, weight: weights.comfortIaq, part: flags.comfortIaq * weights.comfortIaq },
    { key: "Energy / demand", flag: flags.energy, weight: weights.energy, part: flags.energy * weights.energy },
    { key: "Wear / failure risk", flag: flags.wear, weight: weights.wear, part: flags.wear * weights.wear },
    { key: "Confidence × weight", flag: flags.confidence, weight: weights.confidence, part: flags.confidence * weights.confidence },
    { key: "Ease of correction", flag: flags.ease, weight: weights.ease, part: flags.ease * weights.ease },
    { key: "Classification", flag: flags.classification, weight: weights.classification, part: flags.classification * weights.classification },
  ];
}

export function evidenceGate(fields: Record<string, string | undefined | null>): string[] {
  const missing: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || String(v).trim() === "") missing.push(k);
  }
  return missing;
}

export type AdapterKind =
  | "offline-csv"
  | "trane-csv"
  | "gree-register-csv"
  | "bacnet-object"
  | "historian-export"
  | "readonly-connector";

export interface RawImportPoint {
  nativeId: string;
  name: string;
  unit: string;
  role: string;
  value: string;
}

function parseCsv(text: string): string[][] {
  return text.trim().split(/\r?\n/).map((line) => line.split(",").map((c) => c.trim())).filter((r) => r.length > 1);
}

export function runAdapter(kind: AdapterKind, payload: string) {
  if (kind === "readonly-connector") {
    return {
      ok: false as const,
      code: "blocked_requires_winston_approval" as const,
      message: "Read-only live connector is locked. Owner, controls engineer, and OT security must approve.",
      points: [] as RawImportPoint[],
      adapter: kind,
    };
  }
  const rows = parseCsv(payload);
  if (rows.length < 2) {
    return { ok: false as const, message: "CSV needs a header and at least one row.", points: [] as RawImportPoint[], adapter: kind };
  }
  const header = rows[0].map((h) => h.toLowerCase());
  const col = (row: string[], name: string, fb: number) => {
    const i = header.indexOf(name);
    return row[i >= 0 ? i : fb] ?? "";
  };
  const points = rows.slice(1).map((r) => ({
    nativeId: col(r, "native_id", 0) || col(r, "object", 0) || col(r, "register", 0),
    name: col(r, "name", 1),
    unit: col(r, "unit", 2),
    role: col(r, "role", 3) || "sensor",
    value: col(r, "value", 4),
  }));
  return { ok: true as const, message: `Parsed ${points.length} rows via ${kind}.`, points, adapter: kind };
}

export function liveConnectorStub() {
  return {
    ok: false as const,
    code: "blocked_requires_winston_approval" as const,
    message: "Live read-only connector is designed, stubbed, and locked.",
  };
}

export function passportGaps(p?: Record<string, string | undefined> | null): { key: string; label: string }[] {
  if (!p) return [{ key: "passport", label: "Evidence passport (none on this asset or parent)" }];
  return PASSPORT_FIELDS.filter((f) => !String(p[f.key] ?? "").trim()).map((f) => ({ key: String(f.key), label: f.label }));
}

export function passportComplete(p: Record<string, string | undefined>): boolean {
  return passportGaps(p).length === 0;
}

export function resolvePassport<T extends { id: string }>(
  assetId: string,
  assets: { id: string; parentId: string | null; passportId?: string }[],
  passports: T[],
): T | undefined {
  const byId = new Map(assets.map((a) => [a.id, a]));
  let cur = byId.get(assetId);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (cur.passportId) {
      const hit = passports.find((p) => p.id === cur!.passportId);
      if (hit) return hit;
    }
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return undefined;
}

export function mappingApprovalGate(
  point: { assetId: string },
  assets: { id: string; parentId: string | null; passportId?: string }[],
  passports: EvidencePassport[],
): { ok: true; passport: EvidencePassport } | { ok: false; missing: { key: string; label: string }[]; passport?: EvidencePassport } {
  const passport = resolvePassport(point.assetId, assets, passports);
  const missing = passportGaps(passport as unknown as Record<string, string | undefined> | undefined);
  if (missing.length) return { ok: false, missing, passport };
  return { ok: true, passport: passport as EvidencePassport };
}

export function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function workOrderCsv(rows: Record<string, string>[]): string {
  const headers = Object.keys(rows[0] ?? { id: "" });
  return [headers.join(","), ...rows.map((r) => headers.map((h) => csvEscape(r[h] ?? "")).join(","))].join("\n");
}

export function workOrderExportRows(wos: WorkOrder[]): Record<string, string>[] {
  return wos.map((w) => ({
    id: w.id, equipment: w.equipmentName, location: w.location, trade: w.trade, symptom: w.symptom,
    evidence: w.evidence, probable_cause: w.probableCause, safety: w.safetyNotes, parts: w.parts,
    verification: w.verificationTest, status: w.status, created_at: w.createdAt,
  }));
}

export function simplePdf(title: string, lines: string[]): Blob {
  const escaped = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content: string[] = [`BT /F1 14 Tf 48 760 Td (${escaped(title)}) Tj`, "/F1 9 Tf 0 -22 Td"];
  for (const line of lines.slice(0, 48)) content.push(`0 -13 Td (${escaped(line.slice(0, 110))}) Tj`);
  content.push("ET");
  const stream = content.join("\n");
  const objs = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  return new Blob([`%PDF-1.4\n${objs.join("\n")}\ntrailer << /Root 1 0 R >>\n%%EOF\n`], { type: "application/pdf" });
}

export interface CopilotContext {
  points: Point[];
  faults: FaultCard[];
  tasks: { id: string; title: string; dueAt: string; status: string; assetId: string }[];
  assets: { id: string; canonicalName: string; nativeId: string }[];
  documents: { id: string; title: string; excerpt: string; section: string }[];
  alarms: { id: string; message: string; ts: string; state: string }[];
  overrides: Point[];
  buildingName: string;
  routingMode: RoutingMode;
  hostedAllowed: boolean;
}

export function localCopilot(question: string, ctx: CopilotContext): Omit<CopilotMessage, "id" | "at"> {
  const q = question.toLowerCase();
  const citations: Citation[] = [];
  const findPoint = (id: string) => ctx.points.find((p) => p.id === id);

  if (/third floor|floor 3|3rd floor|hot/.test(q) && /why|hot|warm|heat/.test(q)) {
    for (const id of ["p_z3w_t", "p_v301_d", "p_v301_f", "p_sat", "p_fan_s"]) {
      const p = findPoint(id);
      if (p) citations.push({ kind: "point", id: p.id, label: `${p.canonicalName} (${p.nativeId})`, detail: `${p.lastValue} ${p.unit} @ ${p.lastTimestamp}` });
    }
    citations.push({ kind: "fault", id: "fc_hot3", label: "Fault card fc_hot3", detail: "time window 2026-09-02T09:45Z snapshot + 15-min trends" });
    citations.push({ kind: "document", id: "doc_seq_ahu2", label: "AHU-2 SOO §3.2 Occupied Cooling", detail: "sequence · synthetic excerpt" });
    return {
      role: "assistant",
      text: "Observed: Zone 3-West is 78.6°F at 09:45Z. VAV-3-01 damper reports 8% open and airflow 90 cfm. AHU-2 fan status is On and supply air is 63.1°F — the unit is delivering cool air; the box looks starved or stuck. Damper and airflow mappings are still AI-proposed. Hypothesis: linkage, boxing-in, or a mapping error. Missing for a firm rule: an engineer-approved persistence, deadband, and SAT setpoint.",
      citations, observedVsHypothesis: "mixed",
      missingSource: "Engineer-approved damper/airflow rule thresholds and a signed SAT setpoint (blocked_requires_controls_engineer).",
      routingMode: "local", aiLabel: "ai-proposed",
    };
  }
  if (/overrid/.test(q)) {
    const ovs = ctx.overrides;
    if (!ovs.length) return { role: "assistant", text: "No command-type override points are flagged in the current building export.", citations: [], observedVsHypothesis: "observed", routingMode: "local", aiLabel: "ai-proposed" };
    for (const p of ovs) citations.push({ kind: "point", id: p.id, label: `${p.canonicalName} (${p.nativeId})`, detail: `${p.lastValue} @ ${p.lastTimestamp}` });
    const ovDoc = ctx.documents.find((d) => /ahu-2|sequence/i.test(d.title));
    if (ovDoc) citations.push({ kind: "document", id: ovDoc.id, label: `${ovDoc.title} ${ovDoc.section}`, detail: ovDoc.excerpt.slice(0, 80) });
    return { role: "assistant", text: `Observed override-style commands: ${ovs.map((p) => `${p.canonicalName} = ${p.lastValue} (${p.nativeId}) at ${p.lastTimestamp}`).join("; ")}. These are command points in the export, not a live BMS write from this app.`, citations, observedVsHypothesis: "observed", routingMode: "local", aiLabel: "ai-proposed" };
  }
  if (/chiller|repair/.test(q)) {
    return { role: "assistant", text: "No chiller equipment, no CH-1 points, and no repair event exist in this building’s imported records. I will not guess what changed.", citations: [{ kind: "source-needed", id: "missing_chiller", label: "PM history + trends around a chiller repair timestamp" }], observedVsHypothesis: "missing-source", missingSource: "A chiller equipment record, a repair/PM history entry, and a trend window around that timestamp.", routingMode: "local", aiLabel: "ai-proposed" };
  }
  if (/due|ahu-2|ahu 2|this week/.test(q) && /ahu|due|week|task/.test(q)) {
    const due = ctx.tasks.filter((t) => /ahu-2|ahu 2|ahu2/i.test(t.title) || ctx.assets.find((a) => a.id === t.assetId && /ahu-2/i.test(a.canonicalName)));
    for (const t of due) citations.push({ kind: "task", id: t.id, label: t.title, detail: `${t.status} · ${t.dueAt}` });
    const soo = ctx.documents.find((d) => /ahu-2/i.test(d.title));
    if (soo) citations.push({ kind: "document", id: soo.id, label: `${soo.title} ${soo.section}`, detail: "calendar task — interval remains placeholder" });
    if (!due.length) return { role: "assistant", text: "No PM tasks linked to AHU-2 in the current program.", citations: [], observedVsHypothesis: "observed", routingMode: "local", aiLabel: "ai-proposed" };
    return { role: "assistant", text: `Observed AHU-2 work: ${due.map((t) => `${t.title} (${t.status}, due ${t.dueAt.slice(0, 10)})`).join("; ")}. Intervals remain placeholders — due dates are calendar entries, not manufacturer values.`, citations, observedVsHypothesis: "observed", routingMode: "local", aiLabel: "ai-proposed" };
  }
  if (/stale|quality|missing trend/.test(q)) {
    return { role: "assistant", text: "Data-quality items live on Quality. Typical seed issues: AHU2.SPARE.T is stale since 2026-08-12; VAV-3-01 damper/airflow mappings are AI-proposed; the Gree profile has snapshots and no 15-minute historian.", citations: ctx.points.filter((p) => p.quality !== "ok").map((p) => ({ kind: "point" as const, id: p.id, label: p.canonicalName, detail: p.quality })), observedVsHypothesis: "observed", routingMode: "local", aiLabel: "ai-proposed" };
  }
  const hitPoints = ctx.points.filter((p) => q.includes(p.canonicalName.toLowerCase()) || q.includes(p.nativeId.toLowerCase()));
  if (hitPoints.length) {
    for (const p of hitPoints.slice(0, 6)) citations.push({ kind: "point", id: p.id, label: `${p.canonicalName} (${p.nativeId})`, detail: `${p.lastValue} ${p.unit}` });
    return { role: "assistant", text: `Observed values: ${hitPoints.slice(0, 6).map((p) => `${p.canonicalName} ${p.lastValue} ${p.unit} at ${p.lastTimestamp}`).join("; ")}.`, citations, observedVsHypothesis: "observed", routingMode: "local", aiLabel: "ai-proposed" };
  }
  return { role: "assistant", text: `I only answer from imported points, trends, alarms, documents, PM tasks, and fault cards in ${ctx.buildingName}. Ask: why is the third floor hot; which zones are overridden; what changed after the chiller repair; what is due on AHU-2 this week.`, citations: [], observedVsHypothesis: "missing-source", missingSource: "A named asset, point, document, or time window in the current building.", routingMode: "local", aiLabel: "ai-proposed" };
}

export function makeCopilotMessage(partial: Omit<CopilotMessage, "id" | "at">): CopilotMessage {
  return { ...partial, id: uid("cop"), at: new Date().toISOString() };
}

export function dailyBrief(input: {
  buildingName: string;
  due: { id: string; title: string; dueAt: string; status: string }[];
  overdue: { id: string; title: string; dueAt: string }[];
  quality: { id: string; message: string; kind: string }[];
  cards: { id: string; title: string }[];
  queued: number;
  conflicts: number;
  workOrders?: { id: string; equipmentName: string; status: string }[];
}) {
  const wos = input.workOrders ?? [];
  const lines = [
    `CSMS Field daily brief — ${input.buildingName}`,
    `${new Date().toISOString().slice(0, 10)}`,
    "",
    `Overdue (${input.overdue.length})`,
    ...(input.overdue.length ? input.overdue.map((t) => `• ${t.title} · ${t.dueAt.slice(0, 10)}`) : ["• none"]),
    "",
    `Due (${input.due.length})`,
    ...(input.due.length ? input.due.map((t) => `• ${t.title} · ${t.dueAt.slice(0, 10)}`) : ["• none"]),
    "",
    `Open cards (${input.cards.length})`,
    ...(input.cards.length ? input.cards.map((c) => `• ${c.title}`) : ["• none"]),
    "",
    `Open work orders (${wos.length})`,
    ...(wos.length ? wos.map((w) => `• ${w.equipmentName} · ${w.status} · ${w.id}`) : ["• none"]),
    "",
    `Quality (${input.quality.length})`,
    ...(input.quality.length ? input.quality.map((q) => `• ${q.kind}: ${q.message}`) : ["• none"]),
    "",
    `Offline queue ${input.queued} · unresolved conflicts ${input.conflicts}`,
    "No BMS writes. Existing controllers keep the building.",
  ];
  return lines.join("\n");
}

/** Original transcript is never overwritten. Empty original is backfilled once. */
export function applyTranscriptEdit(note: Pick<VoiceNote, "originalTranscript" | "editedTranscript">, edited: string): Pick<VoiceNote, "originalTranscript" | "editedTranscript"> {
  const original = note.originalTranscript.trim() ? note.originalTranscript : note.editedTranscript;
  return { originalTranscript: original, editedTranscript: edited };
}

export function readBackScript(task: {
  title: string;
  evidence: { checklist: { text: string; done: boolean }[] };
  safetyNotes: string[];
}): string {
  const current = task.evidence.checklist.find((s) => !s.done);
  const step = current?.text ?? "Checklist complete.";
  const safety = task.safetyNotes.filter(Boolean).join(" ");
  return `${task.title}. ${step}${safety ? ` Safety: ${safety}` : ""}`;
}

export function evidenceProgress(task: {
  completionEvidenceRequired: EvidenceKind[];
  evidence: { photos: unknown[]; readings: unknown[]; voiceNotes: unknown[]; checklist: { done: boolean }[] };
}): { kind: EvidenceKind; done: boolean }[] {
  return task.completionEvidenceRequired.map((kind) => {
    if (kind === "photo") return { kind, done: task.evidence.photos.length > 0 };
    if (kind === "reading") return { kind, done: task.evidence.readings.length > 0 };
    if (kind === "voice-note") return { kind, done: task.evidence.voiceNotes.length > 0 };
    return { kind, done: task.evidence.checklist.length > 0 && task.evidence.checklist.every((s) => s.done) };
  });
}
