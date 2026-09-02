export type Role = "engineer" | "technician" | "reviewer" | "reader" | "admin";
export type AiLabel = "ai-proposed" | "approved" | "rejected" | "needs-source" | "human";
export type ReviewState = "proposed" | "approved" | "rejected" | "needs-source";
export type IntegrationPath =
  | "offline-csv"
  | "historian-export"
  | "bacnet-object-list"
  | "readonly-connector";
export type WorkKind = "preventive" | "predictive" | "corrective" | "commissioning";
export type Adjudication =
  | "open"
  | "confirmed"
  | "rejected"
  | "duplicate"
  | "suppressed"
  | "unable-to-verify";
export type RoutingMode = "local" | "redacted" | "public";
export type TriggerKind = "calendar" | "runtime" | "condition" | "event-fault";
export type BuildingType = "commercial" | "residential-highrise" | "institutional" | "other";
export type AssetKind =
  | "site"
  | "building"
  | "floor"
  | "zone"
  | "system"
  | "equipment"
  | "component"
  | "sensor"
  | "actuator"
  | "meter"
  | "controller"
  | "gateway";
export type PointRole = "sensor" | "status" | "command" | "setpoint" | "alarm" | "meter";
export type EvidenceKind = "photo" | "reading" | "voice-note" | "checklist";
export type BmsPlatform =
  | "niagara"
  | "metasys"
  | "desigo"
  | "ecostruxure"
  | "alc"
  | "trane-tracer"
  | "honeywell"
  | "daikin-microtech"
  | "gree-gateway"
  | "other"
  | "none";

export const PLATFORM_LABEL: Record<BmsPlatform, string> = {
  niagara: "Niagara",
  metasys: "Johnson Controls Metasys",
  desigo: "Siemens Desigo",
  ecostruxure: "Schneider EcoStruxure",
  alc: "Automated Logic",
  "trane-tracer": "Trane Tracer SC/SC+",
  honeywell: "Honeywell",
  "daikin-microtech": "Daikin Applied / MicroTech",
  "gree-gateway": "Gree gateway / central controller",
  other: "Other",
  none: "None",
};

export const ROLE_LABEL: Record<Role, string> = {
  engineer: "Engineer",
  technician: "Technician",
  reviewer: "Reviewer",
  reader: "Reader",
  admin: "Admin",
};

export interface Company {
  id: string;
  name: string;
  trades: string[];
  cmms: string;
  workOrderFormat: "csv" | "json" | "pdf";
}

export interface Person {
  id: string;
  name: string;
  role: Role;
  companyId: string;
}

export interface Building {
  id: string;
  companyId: string;
  name: string;
  type: BuildingType;
  sizeGsf: number;
  floorCount: number;
  zoneCount: number;
  centralPlant: boolean;
  occupancyScheduleSource: string;
  bmsPlatform: BmsPlatform;
  integrationPath: IntegrationPath;
  profileTag: "trane-ahu-vav" | "gree-vrf" | "custom";
}

export interface EvidencePassport {
  id: string;
  buildingId: string;
  systemId: string;
  manufacturerProductFamily: string;
  equipmentModelSerial: string;
  unitControllerModelFirmware: string;
  supervisorGatewayModelVersion: string;
  nativeProtocolAndPath: string;
  manufacturerDocAndRevision: string;
  pointMapProvenance: string;
  unitsScalingEnumsQuality: string;
  trendAlarmHistoryAvailability: string;
  writeCapability: string;
  serviceLicensingRemote: string;
  reviewerName: string;
  reviewDate: string;
}

export const PASSPORT_FIELDS: { key: keyof EvidencePassport; label: string }[] = [
  { key: "manufacturerProductFamily", label: "Manufacturer and product family" },
  { key: "equipmentModelSerial", label: "Equipment model and serial / version" },
  { key: "unitControllerModelFirmware", label: "Unit controller model and firmware" },
  { key: "supervisorGatewayModelVersion", label: "Supervisor or gateway model and software version" },
  { key: "nativeProtocolAndPath", label: "Native protocol and approved read-only path" },
  { key: "manufacturerDocAndRevision", label: "Manufacturer protocol / point document and revision" },
  { key: "pointMapProvenance", label: "Point map provenance" },
  { key: "unitsScalingEnumsQuality", label: "Units, scaling, enumerations, quality flags" },
  { key: "trendAlarmHistoryAvailability", label: "Trend / alarm / history availability" },
  { key: "writeCapability", label: "Write capability (recorded, disabled)" },
  { key: "serviceLicensingRemote", label: "Service / licensing / remote-access dependencies" },
  { key: "reviewerName", label: "Human reviewer" },
];

export interface MappingMeta {
  confidence: number;
  reviewState: ReviewState;
  aiLabel: AiLabel;
  proposedBy: string;
}

export interface AssetNode {
  id: string;
  buildingId: string;
  parentId: string | null;
  kind: AssetKind;
  nativeId: string;
  canonicalName: string;
  haystackTags: string[];
  brickClass: string;
  sourceDocumentIds: string[];
  passportId?: string;
  mapping: MappingMeta;
  changeHistory: { at: string; field: string; from: string; to: string; by: string }[];
}

export interface Point {
  id: string;
  assetId: string;
  buildingId: string;
  nativeId: string;
  canonicalName: string;
  role: PointRole;
  unit: string;
  commandVsStatus: "command" | "status" | "na";
  quality: "ok" | "stale" | "bad" | "unknown";
  lastValue: string;
  lastTimestamp: string;
  sourceFile: string;
  sourceHash: string;
  importDate: string;
  importedBy: string;
  haystackTags: string[];
  brickClass: string;
  mapping: MappingMeta;
}

export interface TrendSample {
  pointId: string;
  ts: string;
  value: number;
  quality: string;
}

export interface Alarm {
  id: string;
  buildingId: string;
  pointId: string;
  assetId: string;
  message: string;
  ts: string;
  state: "active" | "cleared" | "acked";
  sourceFile: string;
}

export interface DocRecord {
  id: string;
  buildingId: string;
  title: string;
  kind: "sequence" | "om-manual" | "submittal" | "drawing" | "pm-history" | "protocol" | "other";
  revision: string;
  uploadedAt: string;
  uploadedBy: string;
  hash: string;
  fileName: string;
  linkedAssetIds: string[];
  linkedPointIds: string[];
  excerpt: string;
  section: string;
}

export interface CitedValue {
  value: string;
  unit: string;
  placeholder: boolean;
  sourceCitation: string;
}

export interface PmTemplate {
  id: string;
  equipmentFamily: string;
  interval: CitedValue;
  thresholds: { name: string; field: CitedValue }[];
  procedureSteps: string[];
  requiredReadings: { name: string; unit: string }[];
  safetyNotes: string[];
  completionEvidence: EvidenceKind[];
  verificationTest: string;
  trade: string;
}

export interface VoiceNote {
  id: string;
  originalTranscript: string;
  editedTranscript: string;
  capturedAt: string;
  offline: boolean;
}

export interface TaskEvidence {
  photos: { id: string; dataUrl: string; capturedAt: string }[];
  readings: { name: string; value: string; unit: string; capturedAt: string }[];
  voiceNotes: VoiceNote[];
  checklist: { step: number; text: string; done: boolean }[];
}

export interface PmTask {
  id: string;
  buildingId: string;
  assetId: string;
  templateId: string;
  kind: WorkKind;
  trigger: TriggerKind;
  title: string;
  dueAt: string;
  procedureSteps: string[];
  requiredReadings: { name: string; unit: string; value?: string }[];
  safetyNotes: string[];
  trade: string;
  completionEvidenceRequired: EvidenceKind[];
  verificationTest: string;
  status: "due" | "overdue" | "in-progress" | "complete" | "blocked";
  assignedTo?: string;
  evidence: TaskEvidence;
  completedAt?: string;
  completedBy?: string;
  sourceCitation: string;
  basis: string;
  whatAppears: string;
  whyItMatters: string;
}

export interface PriorityBreakdown {
  lifeSafety: number;
  comfortIaq: number;
  energy: number;
  wear: number;
  confidence: number;
  ease: number;
  classification: number;
}

export interface FaultCard {
  id: string;
  buildingId: string;
  assetIds: string[];
  spaceIds: string[];
  title: string;
  whatAppearsWrong: string;
  whyItMatters: string;
  pointsUsed: string[];
  timeWindow: string;
  persistence: string;
  deadband: string;
  ruleId: string;
  ruleVersion: string;
  ruleBasis: string;
  confidence: number;
  impact: string;
  likelyCauses: string[];
  fieldChecks: string[];
  trade: string;
  verificationTest: string;
  adjudication: Adjudication;
  aiLabel: AiLabel;
  flags: PriorityBreakdown;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  buildingId: string;
  fromTaskId?: string;
  fromFaultId?: string;
  equipmentId: string;
  equipmentName: string;
  location: string;
  symptom: string;
  evidence: string;
  probableCause: string;
  trade: string;
  safetyNotes: string;
  parts: string;
  verificationTest: string;
  status: "draft" | "exported" | "adjudicated";
  adjudication: Adjudication;
  createdAt: string;
  notes: VoiceNote[];
}

export interface CommissionPacket {
  id: string;
  buildingId: string;
  assetId: string;
  title: string;
  preFunctional: { item: string; done: boolean }[];
  functionalTests: { script: string; result: "pass" | "fail" | "pending"; evidence: string }[];
  trendRequests: string[];
  signOff: { name: string; date: string; role: string } | null;
}
export type CommissionRecord = CommissionPacket;

export interface AuditEvent {
  id: string;
  at: string;
  actorId: string;
  companyId: string;
  kind:
    | "import"
    | "mapping-approval"
    | "rule-change"
    | "ai-query"
    | "ai-output"
    | "human-decision"
    | "export"
    | "role-change"
    | "delete-attempt"
    | "sync"
    | "passport"
    | "field-capture"
    | "work-order";
  summary: string;
  payload: Record<string, string>;
}

export interface QualityIssue {
  id: string;
  buildingId: string;
  kind:
    | "stale-point"
    | "missing-trend"
    | "impossible-unit"
    | "duplicate-asset"
    | "orphan-point"
    | "broken-relationship"
    | "sensor-drift";
  message: string;
  assetId?: string;
  pointId?: string;
}

export interface ImportRecord {
  id: string;
  buildingId: string;
  fileName: string;
  hash: string;
  date: string;
  importedBy: string;
  kind: string;
  adapter: string;
}

export interface SyncConflict {
  id: string;
  at: string;
  recordId: string;
  field: string;
  local: string;
  remote: string;
  resolution: "kept-local" | "kept-remote" | "unresolved";
}

export interface OfflineQueueItem {
  id: string;
  at: string;
  action: string;
  recordId: string;
  detail?: string;
  synced: boolean;
}

export interface Citation {
  kind: "point" | "document" | "task" | "alarm" | "fault" | "asset" | "source-needed";
  id: string;
  label: string;
  detail?: string;
}

export interface CopilotMessage {
  id: string;
  at: string;
  role: "user" | "assistant";
  text: string;
  citations: Citation[];
  observedVsHypothesis: "observed" | "hypothesis" | "missing-source" | "mixed";
  missingSource?: string;
  routingMode: RoutingMode;
  aiLabel: AiLabel;
}

export interface PriorityWeights {
  lifeSafety: number;
  comfortIaq: number;
  energy: number;
  wear: number;
  confidence: number;
  ease: number;
  classification: number;
}

export interface AppSettings {
  appName: string;
  routingMode: RoutingMode;
  hostedModelPolicy: boolean;
  airplaneMode: boolean;
  voiceAliases: Record<string, string>;
  briefCadence: "daily" | "weekly";
  namingConvention: string;
  onboarded: boolean;
}

export interface OnboardDraft {
  step: number;
  companyName: string;
  role: Role;
  trades: string;
  cmms: string;
  buildingName: string;
  buildingType: BuildingType;
  sizeGsf: string;
  floors: string;
  zones: string;
  centralPlant: boolean;
  occupancySource: string;
  platform: BmsPlatform;
  path: IntegrationPath;
  passport: Partial<EvidencePassport>;
  importAdapter: "trane-csv" | "gree-register-csv" | "bacnet-object" | "historian-export";
  importText: string;
  templateFamily: string;
}

export const PLACEHOLDER_CITATION = "placeholder, engineer must set";
