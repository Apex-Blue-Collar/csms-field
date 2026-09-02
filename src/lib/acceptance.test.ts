import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCommand } from "./commands.ts";
import { applyTranscriptEdit, dailyBrief, evidenceGate, evidenceProgress, liveConnectorStub, mappingApprovalGate, passportGaps, readBackScript, runAdapter, scoreFault, scoreLines, workOrderExportRows } from "./engines.ts";
import { DEFAULT_WEIGHTS, assets, faults, passports, tasks } from "./seed.ts";

assert.deepEqual(evidenceGate({ a: "x", b: "" }), ["b"]);
assert.equal(liveConnectorStub().code, "blocked_requires_winston_approval");
const parsed = runAdapter("trane-csv", "native_id,name,unit,role,value\nAHU2.SA.T,SAT,°F,sensor,63.1");
assert.equal(parsed.ok, true);
assert.equal(runAdapter("readonly-connector", "").code, "blocked_requires_winston_approval");

const card = faults[0];
const score = scoreFault(card.flags, DEFAULT_WEIGHTS);
const sum = scoreLines(card.flags, DEFAULT_WEIGHTS).reduce((a, l) => a + l.part, 0);
assert.ok(Math.abs(score - sum) < 1e-9);

const engine = readFileSync(new URL("./engines.ts", import.meta.url), "utf8");
assert.equal(/setpoint\s*=\s*\d/i.test(engine), false);

const ctx = {
  assets: [{ id: "eq_ahu2", title: "AHU-2", nativeId: "AHU-2" }],
  tasks: [{ id: "t1", title: "AHU-2 filter inspection" }],
  faults: [{ id: "fc_hot3", title: "Floor 3 west running hot with low box airflow" }],
  aliases: { next: "next step", photo: "take photo", flag: "flag issue" },
  nextTaskId: "t1",
};
assert.equal(parseCommand("open AHU-2", ctx).type, "open-asset");
assert.equal(parseCommand("um please open ahu two", ctx).type, "open-asset");
assert.equal(parseCommand("start task", ctx).type, "start-task");
assert.equal(parseCommand("next", ctx).type, "next-step");
assert.equal(parseCommand("photo", ctx).type, "photo");
assert.equal(parseCommand("take a picture", ctx).type, "photo");
assert.equal(parseCommand("read back", ctx).type, "read-back");
assert.equal(parseCommand("read the step", ctx).type, "read-back");
assert.equal(parseCommand("flag issue damper stuck", ctx).type, "flag");
assert.equal(parseCommand("create work order", ctx).type, "work-order");
assert.equal(parseCommand("draft a work order", ctx).type, "work-order");
assert.equal(parseCommand("voice note filter dirty as found", ctx).type, "voice-note");
assert.equal(parseCommand("why is the third floor hot?", ctx).type, "copilot");
assert.equal(parseCommand("daily brief", ctx).type, "brief");

const note = applyTranscriptEdit({ originalTranscript: "filter dirty as found", editedTranscript: "filter dirty as found" }, "filter dirty as-found, both banks");
assert.equal(note.originalTranscript, "filter dirty as found");
assert.equal(note.editedTranscript, "filter dirty as-found, both banks");

const script = readBackScript(tasks[0]);
assert.match(script, /AHU-2 filter inspection/);
assert.match(script, /Lock out/);

const progress = evidenceProgress(tasks[0]);
assert.ok(progress.some((p) => p.kind === "photo" && p.done === false));
assert.ok(progress.some((p) => p.kind === "voice-note"));

const ahuGaps = passportGaps(passports.find((p) => p.id === "pp_ahu2") as unknown as Record<string, string | undefined>);
assert.ok(ahuGaps.some((g) => g.key === "manufacturerDocAndRevision"));
assert.equal(mappingApprovalGate({ assetId: "eq_vav301" }, assets, passports).ok, false);
const filled = { ...passports[0], manufacturerDocAndRevision: "Tracer integration notes rev seed" };
assert.equal(mappingApprovalGate({ assetId: "eq_vav301" }, assets, [filled, passports[1]]).ok, true);

const brief = dailyBrief({ buildingName: "Riverside Tower", due: [{ id: "t1", title: "AHU-2 filter inspection", dueAt: "2026-09-02", status: "due" }], overdue: [], quality: [], cards: [], queued: 0, conflicts: 0, workOrders: [{ id: "wo_1", equipmentName: "AHU-2", status: "draft" }] });
assert.match(brief, /AHU-2 filter inspection/);
assert.match(brief, /Open work orders/);

const rows = workOrderExportRows([{
  id: "wo_1", buildingId: "b_riverside", equipmentId: "eq_ahu2", equipmentName: "AHU-2", location: "AHU-2",
  symptom: "Filter due", evidence: "photos", probableCause: "", trade: "HVAC", safetyNotes: "none", parts: "",
  verificationTest: "photos", status: "draft", adjudication: "open", createdAt: "2026-09-02T00:00:00.000Z", notes: [],
}]);
assert.equal(rows[0]?.equipment, "AHU-2");
assert.ok(rows[0]?.symptom);

console.log("acceptance ok");
