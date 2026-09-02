import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parseCommand } from "./commands";
import {
  liveConnectorStub,
  localCopilot,
  makeCopilotMessage,
  mappingApprovalGate,
  passportComplete,
  readBackScript,
  applyTranscriptEdit,
  runAdapter,
} from "./engines";
import { fieldPhotoDataUrl, uid } from "./utils";
import {
  alarms as seedAlarms,
  assets as seedAssets,
  buildings as seedBuildings,
  commissions as seedCx,
  companies as seedCompanies,
  DEFAULT_SETTINGS,
  DEFAULT_WEIGHTS,
  documents as seedDocs,
  faults as seedFaults,
  imports as seedImports,
  people as seedPeople,
  passports as seedPassports,
  points as seedPoints,
  quality as seedQuality,
  tasks as seedTasks,
  templates as seedTemplates,
  trends as seedTrends,
} from "./seed";
import type {
  Alarm,
  AppSettings,
  AssetNode,
  AuditEvent,
  Building,
  CommissionPacket,
  Company,
  CopilotMessage,
  DocRecord,
  EvidencePassport,
  FaultCard,
  ImportRecord,
  OfflineQueueItem,
  OnboardDraft,
  Person,
  PmTask,
  PmTemplate,
  Point,
  PriorityWeights,
  QualityIssue,
  Role,
  RoutingMode,
  SyncConflict,
  TrendSample,
  WorkOrder,
} from "./types";

type Data = {
  companies: Company[];
  people: Person[];
  buildings: Building[];
  passports: EvidencePassport[];
  assets: AssetNode[];
  points: Point[];
  trends: TrendSample[];
  alarms: Alarm[];
  documents: DocRecord[];
  templates: PmTemplate[];
  tasks: PmTask[];
  faults: FaultCard[];
  workOrders: WorkOrder[];
  commissions: CommissionPacket[];
  audit: AuditEvent[];
  quality: QualityIssue[];
  imports: ImportRecord[];
  conflicts: SyncConflict[];
  queue: OfflineQueueItem[];
  copilot: CopilotMessage[];
  settings: AppSettings;
  weights: PriorityWeights;
  currentUserId: string;
  currentBuildingId: string;
  onboard: OnboardDraft | null;
  lastCommand: string;
  lastHeard: string;
  activeTaskId: string | undefined;
  hydrated: boolean;
};

export interface AppState extends Data {
  hydrateFlag: () => void;
  setUser: (id: string) => void;
  setBuilding: (id: string) => void;
  setSettings: (p: Partial<AppSettings>) => void;
  setRole: (role: Role) => void;
  setAlias: (k: string, v: string) => void;
  log: (e: Omit<AuditEvent, "id" | "at" | "actorId" | "companyId">) => void;
  enqueue: (action: string, recordId: string, detail?: string) => void;
  setAirplane: (on: boolean) => void;
  syncNow: () => void;
  resolveConflict: (id: string, resolution: SyncConflict["resolution"]) => void;
  approveMapping: (pointId: string, state: "approved" | "rejected" | "needs-source") => { ok: true } | { ok: false; reason: string; missing: string[] };
  startTask: (id: string) => void;
  nextChecklistStep: (taskId: string) => void;
  addEvidence: (taskId: string, kind: "photo" | "note" | "voice", value?: string) => void;
  addReading: (taskId: string, name: string, value: string, unit: string) => void;
  editVoiceNote: (taskId: string, noteId: string, edited: string) => void;
  addWorkOrderNote: (woId: string, transcript: string) => void;
  editWorkOrderNote: (woId: string, noteId: string, edited: string) => void;
  readBack: (taskId: string) => string;
  setActiveTask: (id?: string) => void;
  flagIssue: (note: string) => string;
  createWorkOrder: (partial?: Partial<WorkOrder>) => string;
  markExported: (id: string) => void;
  askCopilot: (q: string) => CopilotMessage;
  setRouting: (mode: RoutingMode, policy?: boolean) => void;
  tryLiveConnector: () => ReturnType<typeof liveConnectorStub>;
  tryDeleteAudit: () => boolean;
  savePassport: (p: EvidencePassport) => { ok: true } | { ok: false; reason: string };
  signCommission: (id: string, name: string, role: string) => void;
  runVoice: (text: string, activeTaskId?: string) => ReturnType<typeof parseCommand>;
  applyImport: (kind: string, payload: string) => { ok: boolean; message: string };
  resetDemo: () => void;
}

const DATA: Data = {
  companies: seedCompanies,
  people: seedPeople,
  buildings: seedBuildings,
  passports: seedPassports,
  assets: seedAssets,
  points: seedPoints,
  trends: seedTrends,
  alarms: seedAlarms,
  documents: seedDocs,
  templates: seedTemplates,
  tasks: seedTasks,
  faults: seedFaults,
  workOrders: [],
  commissions: seedCx,
  audit: [
    { id: "aud_imp_a", at: "2026-09-01T15:10:00.000Z", actorId: "u_jordan", companyId: "co_harbor", kind: "import", summary: "Imported trane-ahu2-points.csv", payload: { hash: seedImports[0].hash } },
    { id: "aud_imp_b", at: "2026-09-01T15:10:00.000Z", actorId: "u_priya", companyId: "co_atlas", kind: "import", summary: "Imported gree-vrf-registers.csv", payload: { hash: seedImports[1].hash } },
  ],
  quality: seedQuality,
  imports: seedImports,
  conflicts: [],
  queue: [],
  copilot: [],
  settings: DEFAULT_SETTINGS,
  weights: DEFAULT_WEIGHTS,
  currentUserId: "u_maya",
  currentBuildingId: "b_riverside",
  onboard: null,
  lastCommand: "",
  lastHeard: "",
  activeTaskId: undefined,
  hydrated: false,
};

function actorCompany(s: { people: Person[]; currentUserId: string }) {
  return s.people.find((p) => p.id === s.currentUserId)?.companyId ?? "co_harbor";
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...DATA,
      hydrateFlag: () => set({ hydrated: true }),
      setUser: (id) => {
        const person = get().people.find((p) => p.id === id);
        if (!person) return;
        const b = get().buildings.find((x) => x.companyId === person.companyId);
        set({ currentUserId: id, currentBuildingId: b?.id ?? get().currentBuildingId });
        get().log({ kind: "human-decision", summary: `Session → ${person.name}`, payload: { id } });
      },
      setBuilding: (id) => {
        const person = get().people.find((p) => p.id === get().currentUserId);
        const b = get().buildings.find((x) => x.id === id);
        if (!person || !b || b.companyId !== person.companyId) {
          get().log({ kind: "human-decision", summary: "Isolation blocked a building switch", payload: { id } });
          return;
        }
        set({ currentBuildingId: id });
      },
      setSettings: (p) => set({ settings: { ...get().settings, ...p } }),
      setRole: (role) => {
        set({ people: get().people.map((p) => (p.id === get().currentUserId ? { ...p, role } : p)) });
        get().log({ kind: "rule-change", summary: `Role → ${role}`, payload: { role } });
      },
      setAlias: (k, v) => set({ settings: { ...get().settings, voiceAliases: { ...get().settings.voiceAliases, [k]: v } } }),
      log: (e) => {
        const s = get();
        set({ audit: [{ id: uid("aud"), at: new Date().toISOString(), actorId: s.currentUserId, companyId: actorCompany(s), ...e }, ...s.audit] });
      },
      enqueue: (action, recordId, detail = "") => {
        const item: OfflineQueueItem = { id: uid("q"), at: new Date().toISOString(), action, recordId, detail, synced: false };
        set({ queue: [item, ...get().queue] });
        get().log({ kind: "field-capture", summary: `Queued ${action}`, payload: { recordId, action } });
      },
      setAirplane: (on) => {
        set({ settings: { ...get().settings, airplaneMode: on } });
        get().log({ kind: "rule-change", summary: on ? "Airplane mode on" : "Airplane mode off", payload: { on: String(on) } });
      },
      syncNow: () => {
        const unsynced = get().queue.filter((i) => !i.synced);
        if (!unsynced.length) {
          get().log({ kind: "sync", summary: "Sync: nothing queued", payload: {} });
          return;
        }
        const conflict: SyncConflict = {
          id: uid("cf"),
          at: new Date().toISOString(),
          recordId: unsynced[0].recordId,
          field: unsynced[0].action,
          local: unsynced[0].detail || "field-captured",
          remote: "unchanged-server",
          resolution: "unresolved",
        };
        set({ queue: get().queue.map((i) => ({ ...i, synced: true })), conflicts: [conflict, ...get().conflicts] });
        get().log({ kind: "sync", summary: `Synced ${unsynced.length} record(s). Local evidence kept.`, payload: { conflict: conflict.id } });
      },
      resolveConflict: (id, resolution) => {
        set({ conflicts: get().conflicts.map((c) => (c.id === id ? { ...c, resolution } : c)) });
        get().log({ kind: "human-decision", summary: `Conflict ${id} → ${resolution}`, payload: { id, resolution } });
      },
      approveMapping: (pointId, state) => {
        const s = get();
        const p = s.points.find((x) => x.id === pointId);
        if (!p) return { ok: false, reason: "Point not found.", missing: [] };
        const role = s.people.find((x) => x.id === s.currentUserId)?.role;
        if (!(role === "engineer" || role === "reviewer" || role === "admin")) {
          return { ok: false, reason: "Engineer, reviewer, or admin must decide mapping.", missing: [] };
        }
        if (state === "approved") {
          const gate = mappingApprovalGate(p, s.assets, s.passports);
          if (!gate.ok) {
            return { ok: false, reason: "Passport incomplete. Mapping is not truth until all twelve fields are filled.", missing: gate.missing.map((m) => m.label) };
          }
        }
        set({
          points: get().points.map((x) =>
            x.id === pointId
              ? { ...x, mapping: { ...x.mapping, reviewState: state, aiLabel: state === "approved" ? "approved" : state === "rejected" ? "rejected" : "needs-source" } }
              : x,
          ),
        });
        get().log({ kind: "mapping-approval", summary: `${p.nativeId} → ${state}`, payload: { pointId, state } });
        return { ok: true };
      },
      startTask: (id) => {
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, status: t.status === "complete" ? "complete" : "in-progress" } : t)), activeTaskId: id });
        get().enqueue("start-task", id, "started in field");
      },
      nextChecklistStep: (taskId) => {
        set({
          tasks: get().tasks.map((t) => {
            if (t.id !== taskId) return t;
            const i = t.evidence.checklist.findIndex((s) => !s.done);
            if (i < 0) return { ...t, status: "complete" as const, completedAt: new Date().toISOString() };
            const checklist = t.evidence.checklist.map((s, n) => (n === i ? { ...s, done: true } : s));
            const done = checklist.every((s) => s.done);
            return { ...t, evidence: { ...t.evidence, checklist }, status: done ? ("complete" as const) : ("in-progress" as const), completedAt: done ? new Date().toISOString() : t.completedAt };
          }),
        });
        get().enqueue("checklist-step", taskId);
      },
      addEvidence: (taskId, kind, value) => {
        const at = new Date().toISOString();
        set({
          tasks: get().tasks.map((t) => {
            if (t.id !== taskId) return t;
            const evidence = { ...t.evidence, photos: [...t.evidence.photos], voiceNotes: [...t.evidence.voiceNotes], readings: [...t.evidence.readings] };
            if (kind === "photo") evidence.photos.push({ id: uid("ph"), dataUrl: value && value.startsWith("data:") ? value : fieldPhotoDataUrl(at), capturedAt: at });
            if (kind === "note") evidence.readings.push({ name: "note", value: value ?? "", unit: "text", capturedAt: at });
            if (kind === "voice") {
              const text = (value ?? "").trim();
              evidence.voiceNotes.push({ id: uid("vn"), originalTranscript: text, editedTranscript: text, capturedAt: at, offline: get().settings.airplaneMode });
            }
            return { ...t, evidence };
          }),
          activeTaskId: taskId,
        });
        get().enqueue(`evidence-${kind}`, taskId, kind === "voice" ? (value ?? kind) : kind);
      },
      addReading: (taskId, name, value, unit) => {
        const at = new Date().toISOString();
        set({
          tasks: get().tasks.map((t) => {
            if (t.id !== taskId) return t;
            return { ...t, evidence: { ...t.evidence, readings: [...t.evidence.readings.filter((r) => r.name !== name), { name, value, unit, capturedAt: at }] } };
          }),
        });
        get().enqueue("evidence-reading", taskId, `${name}=${value} ${unit}`);
      },
      editVoiceNote: (taskId, noteId, edited) => {
        set({
          tasks: get().tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              evidence: {
                ...t.evidence,
                voiceNotes: t.evidence.voiceNotes.map((n) => (n.id === noteId ? { ...n, ...applyTranscriptEdit(n, edited) } : n)),
              },
            };
          }),
        });
        get().log({ kind: "field-capture", summary: "Voice note edited — original preserved", payload: { taskId, noteId } });
      },
      addWorkOrderNote: (woId, transcript) => {
        const at = new Date().toISOString();
        const text = transcript.trim();
        set({
          workOrders: get().workOrders.map((w) =>
            w.id === woId
              ? { ...w, notes: [{ id: uid("vn"), originalTranscript: text, editedTranscript: text, capturedAt: at, offline: get().settings.airplaneMode }, ...w.notes] }
              : w,
          ),
        });
        get().enqueue("wo-note", woId, text);
      },
      editWorkOrderNote: (woId, noteId, edited) => {
        set({
          workOrders: get().workOrders.map((w) =>
            w.id === woId
              ? { ...w, notes: w.notes.map((n) => (n.id === noteId ? { ...n, ...applyTranscriptEdit(n, edited) } : n)) }
              : w,
          ),
        });
        get().log({ kind: "field-capture", summary: "Work-order note edited — original preserved", payload: { woId, noteId } });
      },
      readBack: (taskId) => {
        const t = get().tasks.find((x) => x.id === taskId);
        if (!t) return "No task to read back.";
        return readBackScript(t);
      },
      setActiveTask: (id) => set({ activeTaskId: id }),
      flagIssue: (note) => {
        const id = uid("flag");
        get().enqueue("flag-issue", get().currentBuildingId, note);
        get().log({ kind: "field-capture", summary: `Flag: ${note.slice(0, 80)}`, payload: { id } });
        return id;
      },
      createWorkOrder: (partial) => {
        const s = get();
        const id = uid("wo");
        const task = s.tasks.find((t) => t.id === partial?.fromTaskId) ?? s.tasks.find((t) => t.buildingId === s.currentBuildingId);
        const fault = s.faults.find((f) => f.id === partial?.fromFaultId);
        const asset = s.assets.find((a) => a.id === (partial?.equipmentId ?? task?.assetId ?? fault?.assetIds[0]));
        const wo: WorkOrder = {
          id,
          buildingId: s.currentBuildingId,
          fromTaskId: partial?.fromTaskId ?? task?.id,
          fromFaultId: partial?.fromFaultId,
          equipmentId: partial?.equipmentId ?? task?.assetId ?? asset?.id ?? "",
          equipmentName: partial?.equipmentName ?? asset?.canonicalName ?? "",
          location: partial?.location ?? asset?.canonicalName ?? "",
          symptom: partial?.symptom ?? fault?.whatAppearsWrong ?? task?.whatAppears ?? "Field observation",
          evidence: partial?.evidence ?? (fault ? fault.fieldChecks.join("; ") : "Captured on device. No BMS write."),
          probableCause: partial?.probableCause ?? fault?.likelyCauses.join("; ") ?? "",
          trade: partial?.trade ?? task?.trade ?? fault?.trade ?? "HVAC",
          safetyNotes: partial?.safetyNotes ?? task?.safetyNotes.join(" ") ?? "Do not write to the BMS from this app.",
          parts: partial?.parts ?? "",
          verificationTest: partial?.verificationTest ?? task?.verificationTest ?? fault?.verificationTest ?? "",
          status: "draft",
          adjudication: "open",
          createdAt: new Date().toISOString(),
          notes: [],
        };
        set({ workOrders: [wo, ...s.workOrders] });
        get().enqueue("work-order", id, wo.symptom);
        get().log({ kind: "work-order", summary: wo.symptom, payload: { id } });
        return id;
      },
      markExported: (id) => {
        set({ workOrders: get().workOrders.map((w) => (w.id === id ? { ...w, status: "exported" as const } : w)) });
        get().log({ kind: "export", summary: `Exported ${id}`, payload: { id } });
      },
      askCopilot: (q) => {
        const s = get();
        const userMsg = makeCopilotMessage({ role: "user", text: q, citations: [], observedVsHypothesis: "observed", routingMode: s.settings.routingMode, aiLabel: "human" });
        const bldgPoints = s.points.filter((p) => p.buildingId === s.currentBuildingId);
        const answer = makeCopilotMessage(
          localCopilot(q, {
            points: bldgPoints,
            faults: s.faults.filter((f) => f.buildingId === s.currentBuildingId),
            tasks: s.tasks.filter((t) => t.buildingId === s.currentBuildingId),
            assets: s.assets.filter((a) => a.buildingId === s.currentBuildingId),
            documents: s.documents.filter((d) => d.buildingId === s.currentBuildingId),
            alarms: s.alarms.filter((a) => a.buildingId === s.currentBuildingId),
            overrides: bldgPoints.filter((p) => p.commandVsStatus === "command" && /overrid|\.ovr| ovr/i.test(`${p.canonicalName} ${p.nativeId}`)),
            buildingName: s.buildings.find((b) => b.id === s.currentBuildingId)?.name ?? "",
            routingMode: s.settings.routingMode,
            hostedAllowed: s.settings.hostedModelPolicy,
          }),
        );
        set({ copilot: [...s.copilot, userMsg, answer] });
        get().log({ kind: "ai-query", summary: q.slice(0, 160), payload: { id: userMsg.id } });
        get().log({ kind: "ai-output", summary: answer.text.slice(0, 160), payload: { id: answer.id } });
        return answer;
      },
      setRouting: (mode, policy) => {
        set({ settings: { ...get().settings, routingMode: mode, hostedModelPolicy: policy ?? get().settings.hostedModelPolicy } });
        get().log({ kind: "rule-change", summary: `Routing → ${mode}`, payload: { mode } });
      },
      tryLiveConnector: () => liveConnectorStub(),
      tryDeleteAudit: () => {
        get().log({ kind: "delete-attempt", summary: "Delete audit log refused — append-only.", payload: {} });
        return false;
      },
      savePassport: (p) => {
        const exists = get().passports.some((x) => x.id === p.id);
        set({ passports: exists ? get().passports.map((x) => (x.id === p.id ? p : x)) : [p, ...get().passports] });
        const complete = passportComplete(p as unknown as Record<string, string>);
        get().log({ kind: "passport", summary: complete ? `Passport ${p.id} complete` : `Passport ${p.id} saved as draft`, payload: { id: p.id } });
        return complete ? { ok: true } : { ok: false, reason: "Saved as draft. All twelve fields are required before mapping can be approved." };
      },
      signCommission: (id, name, role) => {
        if (!name.trim()) return;
        set({ commissions: get().commissions.map((c) => (c.id === id ? { ...c, signOff: { name, role, date: new Date().toISOString() } } : c)) });
        get().log({ kind: "human-decision", summary: `Human sign-off on ${id} by ${name}`, payload: { id, name } });
      },
      runVoice: (text, activeTaskId) => {
        const s = get();
        const current = activeTaskId ?? s.activeTaskId;
        const action = parseCommand(text, {
          assets: s.assets.filter((a) => a.buildingId === s.currentBuildingId).map((a) => ({ id: a.id, title: a.canonicalName, nativeId: a.nativeId })),
          tasks: s.tasks.filter((t) => t.buildingId === s.currentBuildingId).map((t) => ({ id: t.id, title: t.title })),
          faults: s.faults.filter((f) => f.buildingId === s.currentBuildingId).map((f) => ({ id: f.id, title: f.title })),
          aliases: s.settings.voiceAliases,
          activeTaskId: current,
          nextTaskId: s.tasks.find((t) => t.buildingId === s.currentBuildingId && t.status !== "complete")?.id,
        });
        set({ lastCommand: text, lastHeard: text, activeTaskId: current });
        return action;
      },
      applyImport: (kind, payload) => {
        const r = runAdapter(kind as Parameters<typeof runAdapter>[0], payload);
        if (!r.ok) return { ok: false, message: r.message };
        get().log({ kind: "import", summary: r.message, payload: { adapter: kind } });
        return { ok: true, message: r.message };
      },
      resetDemo: () => set({ ...DATA, hydrated: true, workOrders: [], copilot: [], conflicts: [], queue: [], lastCommand: "", lastHeard: "", activeTaskId: undefined }),
    }),
    {
      name: "csms-field-v2",
      version: 3,
      skipHydration: true,
      migrate: (persisted, version) => {
        const p = { ...((persisted ?? {}) as Record<string, unknown>) };
        const settings = (p.settings ?? {}) as Record<string, unknown>;
        if (version < 3) {
          p.settings = {
            ...DEFAULT_SETTINGS,
            ...settings,
            voiceAliases: { ...DEFAULT_SETTINGS.voiceAliases, ...((settings.voiceAliases as Record<string, string> | undefined) ?? {}) },
          };
        }
        return p as never;
      },
      partialize: (s) => ({
        passports: s.passports,
        points: s.points,
        tasks: s.tasks,
        faults: s.faults,
        workOrders: s.workOrders,
        commissions: s.commissions,
        audit: s.audit,
        conflicts: s.conflicts,
        queue: s.queue,
        copilot: s.copilot,
        settings: s.settings,
        currentUserId: s.currentUserId,
        currentBuildingId: s.currentBuildingId,
        people: s.people,
        activeTaskId: s.activeTaskId,
      }),
    },
  ),
);
