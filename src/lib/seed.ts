import { sha256sync } from "./utils.ts";
import type {
  Alarm,
  AppSettings,
  AssetNode,
  Building,
  CommissionPacket,
  Company,
  DocRecord,
  EvidencePassport,
  FaultCard,
  ImportRecord,
  MappingMeta,
  Person,
  PmTask,
  PmTemplate,
  Point,
  PriorityWeights,
  QualityIssue,
  TrendSample,
} from "./types.ts";
import { PLACEHOLDER_CITATION } from "./types.ts";

const IMPORT_DATE = "2026-09-01T15:10:00.000Z";
const approved: MappingMeta = { confidence: 0.96, reviewState: "approved", aiLabel: "approved", proposedBy: "mapping-pipeline" };
const proposed = (c: number): MappingMeta => ({ confidence: c, reviewState: "proposed", aiLabel: "ai-proposed", proposedBy: "mapping-pipeline" });

export const DEFAULT_WEIGHTS: PriorityWeights = {
  lifeSafety: 100,
  comfortIaq: 40,
  energy: 25,
  wear: 20,
  confidence: 15,
  ease: 5,
  classification: 3,
};

export const DEFAULT_SETTINGS: AppSettings = {
  appName: "CSMS Field",
  routingMode: "local",
  hostedModelPolicy: false,
  airplaneMode: false,
  voiceAliases: { next: "next step", photo: "take photo", picture: "take photo", snap: "take photo", flag: "flag issue", note: "voice note" },
  briefCadence: "daily",
  namingConvention: "canonical + native",
  onboarded: true,
};

export const companies: Company[] = [
  { id: "co_harbor", name: "Harbor Point Properties", trades: ["HVAC", "Controls"], cmms: "none", workOrderFormat: "csv" },
  { id: "co_atlas", name: "Atlas Facilities", trades: ["HVAC", "VRF"], cmms: "none", workOrderFormat: "json" },
];

export const people: Person[] = [
  { id: "u_maya", name: "Maya Chen", role: "technician", companyId: "co_harbor" },
  { id: "u_jordan", name: "Jordan Hale", role: "engineer", companyId: "co_harbor" },
  { id: "u_sam", name: "Sam Okonkwo", role: "reviewer", companyId: "co_harbor" },
  { id: "u_priya", name: "Priya Nair", role: "technician", companyId: "co_atlas" },
  { id: "u_noah", name: "Noah Voss", role: "engineer", companyId: "co_atlas" },
];

export const buildings: Building[] = [
  {
    id: "b_riverside",
    companyId: "co_harbor",
    name: "Riverside Tower",
    type: "commercial",
    sizeGsf: 84000,
    floorCount: 2,
    zoneCount: 3,
    centralPlant: false,
    occupancyScheduleSource: "Imported occupancy CSV (synthetic)",
    bmsPlatform: "trane-tracer",
    integrationPath: "offline-csv",
    profileTag: "trane-ahu-vav",
  },
  {
    id: "b_eastriver",
    companyId: "co_atlas",
    name: "East River Residences",
    type: "residential-highrise",
    sizeGsf: 196000,
    floorCount: 2,
    zoneCount: 3,
    centralPlant: false,
    occupancyScheduleSource: "Central controller schedule export (synthetic)",
    bmsPlatform: "gree-gateway",
    integrationPath: "offline-csv",
    profileTag: "gree-vrf",
  },
];

export const passports: EvidencePassport[] = [
  {
    id: "pp_ahu2",
    buildingId: "b_riverside",
    systemId: "sys_ahu2",
    manufacturerProductFamily: "Trane Tracer SC+ / AHU",
    equipmentModelSerial: "AHU-2 · synthetic seed · not a live unit",
    unitControllerModelFirmware: "UC400 · firmware unconfirmed (synthetic)",
    supervisorGatewayModelVersion: "Tracer SC+ · version recorded as seed",
    nativeProtocolAndPath: "BACnet/IP via offline CSV export (read-only)",
    manufacturerDocAndRevision: "",
    pointMapProvenance: "seed/trane-ahu2-points.csv · import 2026-09-01",
    unitsScalingEnumsQuality: "°F, in. w.c., % open, On/Off enum; quality in export column",
    trendAlarmHistoryAvailability: "15-min trends for SAT/RAT/OAT/static; one alarm export",
    writeCapability: "Recorded as capable on live system; DISABLED in this app. No write path.",
    serviceLicensingRemote: "None in seed. Live connector locked.",
    reviewerName: "Jordan Hale",
    reviewDate: "2026-09-01",
  },
  {
    id: "pp_gree",
    buildingId: "b_eastriver",
    systemId: "sys_vrf1",
    manufacturerProductFamily: "Gree VRF · ME30 gateway / CE52 central controller",
    equipmentModelSerial: "VRF plant · synthetic seed",
    unitControllerModelFirmware: "Indoor PCB unconfirmed (synthetic)",
    supervisorGatewayModelVersion: "ME30-24/D1(BM) gateway · CE52-24/F(C) central",
    nativeProtocolAndPath: "Modbus register map via offline CSV (read-only).",
    manufacturerDocAndRevision: "Synthetic register overlay — not an official Gree protocol PDF",
    pointMapProvenance: "seed/gree-vrf-registers.csv · import 2026-09-01",
    unitsScalingEnumsQuality: "Register scale 0.1 for temps; indoor/outdoor split",
    trendAlarmHistoryAvailability: "Snapshot values only in seed; no 15-min historian",
    writeCapability: "Recorded; DISABLED. No write path.",
    serviceLicensingRemote: "Gateway pattern, not an enterprise BMS supervisor.",
    reviewerName: "Priya Nair",
    reviewDate: "2026-09-01",
  },
];

function asset(p: Omit<AssetNode, "changeHistory" | "sourceDocumentIds" | "mapping"> & { mapping?: MappingMeta; docs?: string[]; history?: AssetNode["changeHistory"] }): AssetNode {
  const { docs, mapping, history, ...rest } = p;
  return { ...rest, changeHistory: history ?? [], sourceDocumentIds: docs ?? [], mapping: mapping ?? approved };
}

export const assets: AssetNode[] = [
  asset({ id: "site_hp", buildingId: "b_riverside", parentId: null, kind: "site", nativeId: "SITE.HP", canonicalName: "Harbor Point Campus", haystackTags: ["site"], brickClass: "brick:Site" }),
  asset({ id: "bldg_rt", buildingId: "b_riverside", parentId: "site_hp", kind: "building", nativeId: "BLDG.RT", canonicalName: "Riverside Tower", haystackTags: ["building"], brickClass: "brick:Building" }),
  asset({ id: "fl_2", buildingId: "b_riverside", parentId: "bldg_rt", kind: "floor", nativeId: "FL.2", canonicalName: "Floor 2", haystackTags: ["floor"], brickClass: "brick:Floor" }),
  asset({ id: "fl_3", buildingId: "b_riverside", parentId: "bldg_rt", kind: "floor", nativeId: "FL.3", canonicalName: "Floor 3", haystackTags: ["floor"], brickClass: "brick:Floor" }),
  asset({ id: "zn_3w", buildingId: "b_riverside", parentId: "fl_3", kind: "zone", nativeId: "ZN.3W", canonicalName: "Zone 3-West", haystackTags: ["zone"], brickClass: "brick:HVAC_Zone" }),
  asset({ id: "sys_ahu2", buildingId: "b_riverside", parentId: "bldg_rt", kind: "system", nativeId: "SYS.AHU2", canonicalName: "AHU-2 Air System", haystackTags: ["ahu"], brickClass: "brick:Air_Handling_Unit", passportId: "pp_ahu2", docs: ["doc_seq_ahu2"] }),
  asset({ id: "eq_ahu2", buildingId: "b_riverside", parentId: "sys_ahu2", kind: "equipment", nativeId: "AHU-2", canonicalName: "AHU-2", haystackTags: ["ahu"], brickClass: "brick:Air_Handling_Unit", passportId: "pp_ahu2", docs: ["doc_seq_ahu2"], history: [{ at: IMPORT_DATE, field: "canonicalName", from: "AHU2", to: "AHU-2", by: "u_jordan" }] }),
  asset({ id: "eq_vav201", buildingId: "b_riverside", parentId: "sys_ahu2", kind: "equipment", nativeId: "VAV-2-01", canonicalName: "VAV-2-01", haystackTags: ["vav"], brickClass: "brick:Variable_Air_Volume_Box" }),
  asset({ id: "eq_vav202", buildingId: "b_riverside", parentId: "sys_ahu2", kind: "equipment", nativeId: "VAV-2-02", canonicalName: "VAV-2-02", haystackTags: ["vav"], brickClass: "brick:Variable_Air_Volume_Box" }),
  asset({ id: "eq_vav301", buildingId: "b_riverside", parentId: "sys_ahu2", kind: "equipment", nativeId: "VAV-3-01", canonicalName: "VAV-3-01", haystackTags: ["vav"], brickClass: "brick:Variable_Air_Volume_Box" }),
  asset({ id: "cmp_fan", buildingId: "b_riverside", parentId: "eq_ahu2", kind: "component", nativeId: "AHU-2.SF", canonicalName: "AHU-2 Supply Fan", haystackTags: ["fan"], brickClass: "brick:Fan" }),
  asset({ id: "m_ahu2", buildingId: "b_riverside", parentId: "eq_ahu2", kind: "meter", nativeId: "EM-AHU-2", canonicalName: "AHU-2 Energy Meter", haystackTags: ["meter"], brickClass: "brick:Electrical_Meter" }),
  asset({ id: "ctl_scplus", buildingId: "b_riverside", parentId: "bldg_rt", kind: "controller", nativeId: "TRACER.SC+", canonicalName: "Tracer SC+", haystackTags: ["controller"], brickClass: "brick:BACnet_Device", passportId: "pp_ahu2" }),
  asset({ id: "site_atlas", buildingId: "b_eastriver", parentId: null, kind: "site", nativeId: "SITE.ATLAS", canonicalName: "Atlas Campus", haystackTags: ["site"], brickClass: "brick:Site" }),
  asset({ id: "bldg_er", buildingId: "b_eastriver", parentId: "site_atlas", kind: "building", nativeId: "BLDG.ER", canonicalName: "East River Residences", haystackTags: ["building"], brickClass: "brick:Building" }),
  asset({ id: "sys_vrf1", buildingId: "b_eastriver", parentId: "bldg_er", kind: "system", nativeId: "SYS.VRF1", canonicalName: "VRF Plant 1", haystackTags: ["vrf"], brickClass: "brick:Terminal_Unit", passportId: "pp_gree" }),
  asset({ id: "eq_odu1", buildingId: "b_eastriver", parentId: "sys_vrf1", kind: "equipment", nativeId: "ODU-1", canonicalName: "ODU-1", haystackTags: ["odu"], brickClass: "brick:Condenser" }),
  asset({ id: "eq_idu101", buildingId: "b_eastriver", parentId: "sys_vrf1", kind: "equipment", nativeId: "IDU-101", canonicalName: "IDU-101", haystackTags: ["idu"], brickClass: "brick:Fan_Coil_Unit" }),
  asset({ id: "eq_idu102", buildingId: "b_eastriver", parentId: "sys_vrf1", kind: "equipment", nativeId: "IDU-102", canonicalName: "IDU-102", haystackTags: ["idu"], brickClass: "brick:Fan_Coil_Unit" }),
  asset({ id: "gw_me30", buildingId: "b_eastriver", parentId: "sys_vrf1", kind: "gateway", nativeId: "ME30-24/D1(BM)", canonicalName: "Gree ME30 Gateway", haystackTags: ["gateway"], brickClass: "brick:Gateway", passportId: "pp_gree" }),
];

const FILE_A = "trane-ahu2-points.csv";
const HASH_A = sha256sync("trane-ahu2-points.csv|riverside|v1");
const FILE_B = "gree-vrf-registers.csv";
const HASH_B = sha256sync("gree-vrf-registers.csv|eastriver|v1");

function pt(
  id: string, buildingId: string, assetId: string, nativeId: string, canonicalName: string,
  role: Point["role"], unit: string, cvs: Point["commandVsStatus"], lastValue: string, lastTimestamp: string, extra?: Partial<Point>,
): Point {
  const file = buildingId === "b_riverside" ? FILE_A : FILE_B;
  return {
    id, buildingId, assetId, nativeId, canonicalName, role, unit, commandVsStatus: cvs, quality: "ok", lastValue, lastTimestamp,
    sourceFile: file, sourceHash: buildingId === "b_riverside" ? HASH_A : HASH_B, importDate: IMPORT_DATE,
    importedBy: buildingId === "b_riverside" ? "u_jordan" : "u_priya", haystackTags: [], brickClass: "", mapping: approved, ...extra,
  };
}

export const points: Point[] = [
  pt("p_sat", "b_riverside", "eq_ahu2", "AHU2.SA.T", "AHU-2 Supply Air Temp", "sensor", "°F", "na", "63.1", "2026-09-02T09:45:00.000Z"),
  pt("p_rat", "b_riverside", "eq_ahu2", "AHU2.RA.T", "AHU-2 Return Air Temp", "sensor", "°F", "na", "74.8", "2026-09-02T09:45:00.000Z"),
  pt("p_oat", "b_riverside", "eq_ahu2", "AHU2.OA.T", "Outside Air Temp", "sensor", "°F", "na", "81.2", "2026-09-02T09:45:00.000Z"),
  pt("p_fan_s", "b_riverside", "cmp_fan", "AHU2.SF.ST", "AHU-2 Fan Status", "status", "enum", "status", "On", "2026-09-02T09:45:00.000Z"),
  pt("p_fan_c", "b_riverside", "cmp_fan", "AHU2.SF.CMD", "AHU-2 Fan Command", "command", "enum", "command", "On", "2026-09-02T09:45:00.000Z"),
  pt("p_static", "b_riverside", "eq_ahu2", "AHU2.SA.SP", "AHU-2 Duct Static", "sensor", "inWC", "na", "1.12", "2026-09-02T09:45:00.000Z"),
  pt("p_z2n_t", "b_riverside", "eq_vav201", "VAV201.ZN.T", "Zone 2-North Temp", "sensor", "°F", "na", "72.4", "2026-09-02T09:45:00.000Z"),
  pt("p_v202_ov", "b_riverside", "eq_vav202", "VAV202.OCC.OVR", "VAV-2-02 Occupancy Override", "command", "enum", "command", "Occupied", "2026-09-02T08:12:00.000Z"),
  pt("p_z3w_t", "b_riverside", "eq_vav301", "VAV301.ZN.T", "Zone 3-West Temp", "sensor", "°F", "na", "78.6", "2026-09-02T09:45:00.000Z"),
  pt("p_v301_d", "b_riverside", "eq_vav301", "VAV301.DPR.POS", "VAV-3-01 Damper", "sensor", "%", "na", "8", "2026-09-02T09:45:00.000Z", { mapping: proposed(0.74) }),
  pt("p_v301_f", "b_riverside", "eq_vav301", "VAV301.SA.F", "VAV-3-01 Airflow", "sensor", "cfm", "na", "90", "2026-09-02T09:45:00.000Z", { mapping: proposed(0.71) }),
  pt("p_spare", "b_riverside", "eq_ahu2", "AHU2.SPARE.T", "AHU-2 Spare Temp", "sensor", "°F", "na", "—", "2026-08-12T04:00:00.000Z", { quality: "stale" }),
  pt("p_odu_tdis", "b_eastriver", "eq_odu1", "30001", "ODU-1 Discharge Temp", "sensor", "°C", "na", "72.3", "2026-09-02T09:40:00.000Z"),
  pt("p_idu101_t", "b_eastriver", "eq_idu101", "31011", "IDU-101 Room Temp", "sensor", "°C", "na", "23.4", "2026-09-02T09:40:00.000Z"),
  pt("p_idu102_t", "b_eastriver", "eq_idu102", "31021", "IDU-102 Room Temp", "sensor", "°C", "na", "26.8", "2026-09-02T09:40:00.000Z"),
  pt("p_idu102_lat", "b_eastriver", "eq_idu102", "31024", "IDU-102 Leaving Air", "sensor", "°C", "na", "4.2", "2026-09-02T09:40:00.000Z", { mapping: proposed(0.68) }),
];

function series(pointId: string, startVal: number, wobble: number): TrendSample[] {
  const out: TrendSample[] = [];
  const start = Date.parse("2026-09-01T22:00:00.000Z");
  for (let i = 0; i < 48; i++) {
    out.push({ pointId, ts: new Date(start + i * 15 * 60 * 1000).toISOString(), value: Number((startVal + Math.sin(i / 3) * wobble).toFixed(2)), quality: "ok" });
  }
  return out;
}

export const trends: TrendSample[] = [
  ...series("p_sat", 62.4, 2.8),
  ...series("p_z3w_t", 76.8, 1.6),
  ...series("p_v301_f", 110, 40),
  ...series("p_idu102_t", 25.1, 1.1),
];

export const alarms: Alarm[] = [
  { id: "al_static", buildingId: "b_riverside", pointId: "p_static", assetId: "eq_ahu2", message: "AHU-2 High Duct Static — cleared", ts: "2026-09-01T21:18:00.000Z", state: "cleared", sourceFile: "trane-alarms.csv" },
];

export const documents: DocRecord[] = [
  {
    id: "doc_seq_ahu2", buildingId: "b_riverside", title: "AHU-2 Sequence of Operation (synthetic excerpt)", kind: "sequence",
    revision: "A · seed", uploadedAt: IMPORT_DATE, uploadedBy: "u_jordan", hash: sha256sync("seq-ahu2"),
    fileName: "AHU-2-SOO-excerpt.md", linkedAssetIds: ["eq_ahu2", "sys_ahu2"], linkedPointIds: ["p_sat", "p_fan_s"],
    excerpt: "AHU-2 supply fan commanded On during occupied. Cooling valve modulates to maintain supply air temperature at the SAT setpoint (setpoint is a field the engineer must enter; not stored as an approved value).",
    section: "§3.2 Occupied Cooling",
  },
  {
    id: "doc_gree_map", buildingId: "b_eastriver", title: "Gree ME30 register overlay (synthetic)", kind: "protocol",
    revision: "seed", uploadedAt: IMPORT_DATE, uploadedBy: "u_priya", hash: sha256sync("gree-map"),
    fileName: "gree-me30-registers.csv", linkedAssetIds: ["gw_me30"], linkedPointIds: ["p_odu_tdis"],
    excerpt: "ME30-24/D1(BM) exposes Modbus RTU/TCP and BACnet/IP for multi-VRF. This seed is an equipment-level gateway pattern, not an enterprise BMS supervisor.",
    section: "Gateway vs supervisor",
  },
];

export const templates: PmTemplate[] = [
  {
    id: "tpl_ahu_filter", equipmentFamily: "AHU",
    interval: { value: "", unit: "days", placeholder: true, sourceCitation: PLACEHOLDER_CITATION },
    thresholds: [{ name: "Filter dP replace", field: { value: "", unit: "inWC", placeholder: true, sourceCitation: PLACEHOLDER_CITATION } }],
    procedureSteps: [
      "Lock out / tag out per site safety. Confirm fan status is Off before opening the section.",
      "Photograph filter bank as-found, both sides.",
      "Record filter differential if a gauge is present (reading only — no replace threshold is approved in this app).",
      "Replace or clean only if the engineer-approved criterion on the task is filled. Otherwise stop and flag.",
      "Photograph as-left. Restore access panels. Clear lockout.",
    ],
    requiredReadings: [{ name: "Fan status", unit: "enum" }, { name: "Filter condition note", unit: "text" }],
    safetyNotes: ["Existing controllers keep safeties. Do not change setpoints from this app."],
    completionEvidence: ["photo", "reading", "checklist", "voice-note"],
    verificationTest: "Fan status matches command. Access panels secured. Photos attached.",
    trade: "HVAC",
  },
];

function emptyEvidence(steps: string[]): PmTask["evidence"] {
  return { photos: [], readings: [], voiceNotes: [], checklist: steps.map((text, i) => ({ step: i + 1, text, done: false })) };
}

export const tasks: PmTask[] = [
  {
    id: "t_ahu2_filter", buildingId: "b_riverside", assetId: "eq_ahu2", templateId: "tpl_ahu_filter",
    kind: "preventive", trigger: "calendar", title: "AHU-2 filter inspection", dueAt: "2026-09-02T16:00:00.000Z",
    procedureSteps: templates[0].procedureSteps, requiredReadings: templates[0].requiredReadings,
    safetyNotes: templates[0].safetyNotes, trade: "HVAC", completionEvidenceRequired: templates[0].completionEvidence,
    verificationTest: templates[0].verificationTest, status: "due", assignedTo: "u_maya",
    evidence: emptyEvidence(templates[0].procedureSteps),
    sourceCitation: "Calendar task entered by Jordan Hale · interval remains placeholder",
    basis: "Human-scheduled. Manufacturer interval not approved.",
    whatAppears: "Filter inspection is due on AHU-2 today.",
    whyItMatters: "Skipped filtration shows up later as coil loading — this is a PM visit, not a fault.",
  },
  {
    id: "t_vav301_check", buildingId: "b_riverside", assetId: "eq_vav301", templateId: "tpl_ahu_filter",
    kind: "corrective", trigger: "event-fault", title: "VAV-3-01 damper / airflow field check", dueAt: "2026-08-28T16:00:00.000Z",
    procedureSteps: [
      "Read back the fault card before you open the ceiling.",
      "Measure zone temp and compare to the last trend sample.",
      "Visually confirm damper position versus VAV301.DPR.POS.",
      "Check for disconnected linkage, stuck blade, or boxed-in box.",
      "Do not command the damper from this app. Note as-found only.",
    ],
    requiredReadings: [{ name: "Zone temp as-found", unit: "°F" }, { name: "Damper visual %", unit: "%" }],
    safetyNotes: ["Ladder work. Do not write to the VAV controller."],
    trade: "Controls", completionEvidenceRequired: ["photo", "reading", "voice-note"],
    verificationTest: "As-found photos and readings attached.", status: "overdue", assignedTo: "u_maya",
    evidence: emptyEvidence(["Read back the fault card before you open the ceiling.", "Measure zone temp and compare to the last trend sample.", "Visually confirm damper position versus VAV301.DPR.POS.", "Check for disconnected linkage, stuck blade, or boxed-in box.", "Do not command the damper from this app. Note as-found only."]),
    sourceCitation: "Opened from fault card fc_hot3",
    basis: "Event-driven from an AI-proposed card. Mapping of damper/airflow is unapproved.",
    whatAppears: "Floor 3 west hot with low reported airflow.",
    whyItMatters: "Occupied comfort. Mapping may be wrong — walk the box.",
  },
  {
    id: "t_idu102", buildingId: "b_eastriver", assetId: "eq_idu102", templateId: "tpl_ahu_filter",
    kind: "preventive", trigger: "calendar", title: "IDU-102 leaving-air check", dueAt: "2026-09-03T12:00:00.000Z",
    procedureSteps: ["Confirm indoor unit tag vs register 31024.", "Photograph filter.", "Record room temp."],
    requiredReadings: [{ name: "Room temp", unit: "°C" }],
    safetyNotes: ["Do not write to the VRF gateway."], trade: "VRF", completionEvidenceRequired: ["photo", "reading"],
    verificationTest: "Photos attached.", status: "due", assignedTo: "u_priya",
    evidence: emptyEvidence(["Confirm indoor unit tag vs register 31024.", "Photograph filter.", "Record room temp."]),
    sourceCitation: "Calendar entry. No manufacturer interval stored.",
    basis: "Human-scheduled.",
    whatAppears: "IDU-102 leaving-air mapping is still AI-proposed.",
    whyItMatters: "Apartment comfort. Need source before a rule.",
  },
];

export const faults: FaultCard[] = [
  {
    id: "fc_hot3", buildingId: "b_riverside", assetIds: ["eq_vav301", "eq_ahu2"], spaceIds: ["fl_3", "zn_3w"],
    title: "Floor 3 west running hot with low box airflow",
    whatAppearsWrong: "Zone 3-West reads 78.6°F while VAV-3-01 damper is 8% and airflow 90 cfm. AHU-2 is delivering ~63°F supply air.",
    whyItMatters: "Occupied floor comfort. Box may be starved or the mapping may be wrong — damper/airflow are still AI-proposed.",
    pointsUsed: ["p_z3w_t", "p_v301_d", "p_v301_f", "p_sat", "p_fan_s"],
    timeWindow: "2026-09-02T09:45Z snapshot + 15-min trends",
    persistence: PLACEHOLDER_CITATION, deadband: PLACEHOLDER_CITATION,
    ruleId: "rule_hot_box_observe", ruleVersion: "0.1-placeholder",
    ruleBasis: "Observed values only. No approved SAT setpoint or damper persistence in this app.",
    confidence: 0.7, impact: "Comfort on floor 3 west. Equipment protection not claimed.",
    likelyCauses: ["Stuck damper / linkage", "Boxing-in", "Mapping error on VAV301.DPR.POS or VAV301.SA.F"],
    fieldChecks: ["Walk VAV-3-01", "Photograph damper arm", "Do not treat AI-proposed mapping as truth"],
    trade: "Controls", verificationTest: "As-found photos vs native IDs.",
    adjudication: "open", aiLabel: "ai-proposed",
    flags: { lifeSafety: 0, comfortIaq: 1, energy: 1, wear: 1, confidence: 0.7, ease: 0.6, classification: 0.5 },
    createdAt: "2026-09-02T09:50:00.000Z",
  },
  {
    id: "fc_idu102", buildingId: "b_eastriver", assetIds: ["eq_idu102"], spaceIds: [],
    title: "IDU-102 room warm with low leaving-air temperature",
    whatAppearsWrong: "IDU-102 room 26.8°C with leaving air 4.2°C. Neighbor IDU-101 is 23.4°C.",
    whyItMatters: "Possible airflow or filter issue. Not treated as a frost-protection diagnosis.",
    pointsUsed: ["p_idu102_t", "p_idu102_lat", "p_idu101_t"],
    timeWindow: "snapshot 2026-09-02T09:40Z (no 15-min historian)",
    persistence: PLACEHOLDER_CITATION, deadband: PLACEHOLDER_CITATION,
    ruleId: "rule_idu_delta_observe", ruleVersion: "0.1-placeholder",
    ruleBasis: "Observed snapshot only. No manufacturer frost rule loaded.",
    confidence: 0.51, impact: "Comfort in IDU-102. Equipment protection not claimed.",
    likelyCauses: ["Dirty filter", "Low indoor airflow", "Leaving-air point mapping still AI-proposed"],
    fieldChecks: ["Inspect IDU-102 filter", "Confirm supply at the grille", "Do not write to the gateway"],
    trade: "VRF", verificationTest: "Filter photo and room temp as-found.",
    adjudication: "open", aiLabel: "ai-proposed",
    flags: { lifeSafety: 0, comfortIaq: 1, energy: 0, wear: 1, confidence: 0.51, ease: 1, classification: 0 },
    createdAt: "2026-09-02T09:52:00.000Z",
  },
];

export const commissions: CommissionPacket[] = [
  {
    id: "cx_ahu2", buildingId: "b_riverside", assetId: "eq_ahu2", title: "AHU-2 functional performance packet",
    preFunctional: [
      { item: "Nameplate photographed and stored", done: true },
      { item: "Point list imported with hashes", done: true },
      { item: "Evidence passport complete (12 fields)", done: false },
    ],
    functionalTests: [
      { script: "Occupied: fan status matches fan command (observed On/On).", result: "pass", evidence: "p_fan_s and p_fan_c at 2026-09-02T09:45Z" },
      { script: "SAT tracking versus an approved SAT setpoint.", result: "pending", evidence: "Setpoint not entered — placeholder." },
    ],
    trendRequests: ["SAT, RAT, duct static, 15-minute, occupied period"],
    signOff: null,
  },
];

export const quality: QualityIssue[] = [
  { id: "q_stale", buildingId: "b_riverside", kind: "stale-point", message: "AHU2.SPARE.T last sample 2026-08-12 — stale.", pointId: "p_spare", assetId: "eq_ahu2" },
  { id: "q_map", buildingId: "b_riverside", kind: "sensor-drift", message: "VAV-3-01 damper and airflow mappings are still AI-proposed.", assetId: "eq_vav301", pointId: "p_v301_d" },
  { id: "q_hist", buildingId: "b_eastriver", kind: "missing-trend", message: "East River seed has snapshots only — no 15-minute historian.", assetId: "sys_vrf1" },
];

export const imports: ImportRecord[] = [
  { id: "imp_a", buildingId: "b_riverside", fileName: FILE_A, hash: HASH_A, date: IMPORT_DATE, importedBy: "u_jordan", kind: "point-list", adapter: "trane-csv" },
  { id: "imp_b", buildingId: "b_eastriver", fileName: FILE_B, hash: HASH_B, date: IMPORT_DATE, importedBy: "u_priya", kind: "register-map", adapter: "gree-register-csv" },
];
