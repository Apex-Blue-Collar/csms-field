export type CommandAction =
  | { type: "navigate"; to: "/" | "/tasks" | "/assets" | "/copilot" | "/faults" | "/quality" | "/more" | "/briefs" | "/work-orders"; speak: string }
  | { type: "open-task"; taskId: string; speak: string }
  | { type: "open-asset"; assetId: string; speak: string }
  | { type: "open-fault"; faultId: string; speak: string }
  | { type: "start-task"; taskId: string; speak: string }
  | { type: "next-step"; taskId: string; speak: string }
  | { type: "read-back"; taskId: string; speak: string }
  | { type: "photo"; taskId: string; speak: string }
  | { type: "voice-note"; taskId: string; note: string; speak: string }
  | { type: "flag"; note: string; speak: string }
  | { type: "work-order"; taskId?: string; faultId?: string; speak: string }
  | { type: "copilot"; question: string; speak: string }
  | { type: "airplane"; on: boolean; speak: string }
  | { type: "sync"; speak: string }
  | { type: "brief"; speak: string }
  | { type: "unknown"; speak: string };

export interface CommandSubject {
  id: string;
  title: string;
  nativeId?: string;
  aliases?: string[];
}

export interface CommandContext {
  assets: CommandSubject[];
  tasks: CommandSubject[];
  faults: CommandSubject[];
  aliases: Record<string, string>;
  activeTaskId?: string;
  nextTaskId?: string;
}

export const FIELD_COMMANDS = [
  { phrase: "open AHU-2", hint: "Open asset" },
  { phrase: "start task", hint: "Start" },
  { phrase: "next step", hint: "Advance" },
  { phrase: "take photo", hint: "Evidence" },
  { phrase: "read back", hint: "Hear the step" },
  { phrase: "voice note filter dirty as found", hint: "Dictate" },
  { phrase: "flag issue damper stuck", hint: "Flag" },
  { phrase: "create work order", hint: "CMMS draft" },
] as const;

export const NOISY_HINT = "Plant noise — hold close, one command, then release. Type if the fans win.";

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function applyAliases(q: string, aliases: Record<string, string>) {
  let out = ` ${q} `;
  for (const [k, v] of Object.entries(aliases)) {
    if (!k.trim()) continue;
    out = out.replace(new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), ` ${v} `);
  }
  return norm(out);
}

/** Collapse fillers and plant-room homophones so short commands still parse. */
export function denoiseTranscript(s: string) {
  let q = ` ${norm(s)} `;
  q = q.replace(/\ba\s*h\s*u\s*[- ]?(two|2)\b/g, " ahu-2 ");
  q = q.replace(/\bahu\s*[- ]?(two|2)\b/g, " ahu-2 ");
  q = q.replace(/\bvav\s*[- ]?(3|three)\s*[- ]?(0|oh|zero)?\s*[- ]?(1|one)\b/g, " vav-3-01 ");
  q = q.replace(/\bvav\s*[- ]?301\b/g, " vav-3-01 ");
  q = q.replace(/\bidu\s*[- ]?(1|one)\s*[- ]?(0|oh|zero)\s*[- ]?(2|two)\b/g, " idu-102 ");
  q = q.replace(/\btake\s+a\s+(photo|picture)\b/g, " take photo ");
  q = q.replace(/\b(snap|capture)\s+(a\s+)?(photo|picture)\b/g, " take photo ");
  q = q.replace(/\b(picture|photo evidence)\b/g, " take photo ");
  q = q.replace(/\bread\s+(it\s+)?back\b/g, " read back ");
  q = q.replace(/\bread\s+(the\s+)?(step|safety|checklist)\b/g, " read back ");
  q = q.replace(/\b(new|make|draft)\s+(a\s+)?work order\b/g, " create work order ");
  q = q.replace(/\bbegin(\s+the)?\s+(task|work)\b/g, " start task ");
  q = q.replace(/\bstart(\s+the)?\s+(task|work)\b/g, " start task ");
  q = q.replace(/\bmark\s+(it\s+)?(complete|done|next)\b/g, " next step ");
  q = q.replace(/\bdictate(\s+a)?\s+(note|this)\b/g, " voice note ");
  q = q.replace(/\btake\s+a\s+note\b/g, " voice note ");
  q = q.replace(/\bflag\s+(this|that|a problem|a fault)\b/g, " flag issue ");
  q = q.replace(/\b(um+|uh+|er+|ah+|please|just|like|can you|could you|would you|hey|ok|okay|so|now)\b/g, " ");
  return norm(q);
}

function scoreHit(q: string, item: CommandSubject): number {
  const name = norm(item.title);
  const native = norm(item.nativeId ?? "");
  if (!name && !native) return 0;
  if (q.includes(name) && name.length > 2) return 80 + name.length;
  if (native && q.includes(native) && native.length > 2) return 70 + native.length;
  const tokens = name.split(/[\s/_-]+/).filter((t) => t.length > 2);
  let n = 0;
  for (const t of tokens) if (q.includes(t)) n += 12;
  return n;
}

function best(q: string, items: CommandSubject[]): CommandSubject | undefined {
  let top: CommandSubject | undefined;
  let s = 18;
  for (const it of items) {
    const v = scoreHit(q, it);
    if (v > s) {
      s = v;
      top = it;
    }
  }
  return top;
}

function taskId(ctx: CommandContext) {
  return ctx.activeTaskId ?? ctx.nextTaskId;
}

export function parseCommand(raw: string, ctx: CommandContext): CommandAction {
  const heardRaw = denoiseTranscript(applyAliases(norm(raw), ctx.aliases));
  const heard = heardRaw === "photo" || heardRaw === "picture" ? "take photo" : heardRaw;
  if (!heard) {
    return { type: "unknown", speak: "I did not catch that. Plant noise — hold close, or type open asset, start task, next step." };
  }

  if (/daily brief|read (the )?brief|export brief/.test(heard)) {
    return { type: "brief", speak: "Opening today’s brief." };
  }
  if (/^(today|home|brief)$/.test(heard) || /go (home|today)/.test(heard)) {
    return { type: "navigate", to: "/", speak: "Today." };
  }
  if (/^(tasks|task list)$/.test(heard) || /open tasks/.test(heard)) {
    return { type: "navigate", to: "/tasks", speak: "Tasks." };
  }
  if (/^open assets?$/.test(heard) || /^assets$/.test(heard) || /open assets|registry/.test(heard)) {
    return { type: "navigate", to: "/assets", speak: "Asset registry." };
  }
  if (/copilot|ask the building/.test(heard) && !/why|which|what |how /.test(heard)) {
    return { type: "navigate", to: "/copilot", speak: "Copilot." };
  }
  if (/fault cards|faults$/.test(heard)) {
    return { type: "navigate", to: "/faults", speak: "Fault cards." };
  }

  if (/airplane|go offline|offline mode/.test(heard)) {
    return { type: "airplane", on: true, speak: "Airplane mode on. Capture stays on device." };
  }
  if (/go online|leave airplane|reconnect/.test(heard)) {
    return { type: "airplane", on: false, speak: "Back online. Ready to sync." };
  }
  if (/^sync|sync now|reconnect and sync/.test(heard)) {
    return { type: "sync", speak: "Syncing field records. Local evidence is kept." };
  }

  if (/take photo|capture photo/.test(heard)) {
    const id = taskId(ctx);
    if (!id) return { type: "unknown", speak: "No active task. Open a task first, then say take photo." };
    return { type: "photo", taskId: id, speak: "Photo logged on the task. Use your free hand if the plant is loud." };
  }

  if (/voice note/.test(heard)) {
    const id = taskId(ctx);
    if (!id) return { type: "unknown", speak: "No task for a note. Open a task, then say voice note." };
    const note = heard.replace(/^voice note/, "").trim();
    return {
      type: "voice-note",
      taskId: id,
      note,
      speak: note ? "Voice note stored verbatim. Original is kept if you edit." : "Hold close and say the note, or type it — fans eat quiet speech.",
    };
  }

  if (/read back/.test(heard)) {
    const id = taskId(ctx);
    if (!id) return { type: "unknown", speak: "No task to read back." };
    return { type: "read-back", taskId: id, speak: "Reading the current step and safety." };
  }

  if (/next step|^next$/.test(heard)) {
    const id = taskId(ctx);
    if (!id) return { type: "unknown", speak: "No task in progress. Say start task." };
    return { type: "next-step", taskId: id, speak: "Advancing the checklist." };
  }

  if (/start task/.test(heard)) {
    const id = taskId(ctx);
    if (!id) return { type: "unknown", speak: "Nothing assigned to start." };
    return { type: "start-task", taskId: id, speak: "Starting the task." };
  }

  if (/flag issue/.test(heard) || /flag( an? | )?(issue|problem|fault)/.test(heard) || heard.startsWith("flag ")) {
    const note = heard.replace(/^flag( an?)? (issue|problem|fault)?/, "").trim() || heard;
    return { type: "flag", note, speak: "Flagged. It lands on data quality until a reviewer names the source." };
  }

  if (/create work order|work order/.test(heard)) {
    const task = taskId(ctx);
    const fault = best(heard, ctx.faults);
    return {
      type: "work-order",
      taskId: task,
      faultId: fault?.id,
      speak: "Drafting a CMMS-ready work order.",
    };
  }

  if (/^open /.test(heard) || /open (asset|equipment|ahu|vav|idu|odu|task|card)/.test(heard)) {
    const task = best(heard, ctx.tasks);
    const asset = best(heard, ctx.assets);
    const fault = best(heard, ctx.faults);
    const scores = [
      task ? { kind: "task" as const, id: task.id, s: scoreHit(heard, task), name: task.title } : null,
      asset ? { kind: "asset" as const, id: asset.id, s: scoreHit(heard, asset), name: asset.title } : null,
      fault ? { kind: "fault" as const, id: fault.id, s: scoreHit(heard, fault), name: fault.title } : null,
    ].filter(Boolean) as { kind: "task" | "asset" | "fault"; id: string; s: number; name: string }[];
    scores.sort((a, b) => b.s - a.s);
    const hit = scores[0];
    if (!hit) return { type: "unknown", speak: "I could not match an asset or task in this building." };
    if (hit.kind === "task") return { type: "open-task", taskId: hit.id, speak: `Opening ${hit.name}.` };
    if (hit.kind === "fault") return { type: "open-fault", faultId: hit.id, speak: `Opening ${hit.name}.` };
    return { type: "open-asset", assetId: hit.id, speak: `Opening ${hit.name}.` };
  }

  if (/why |which |what |how /.test(heard) || /third floor|overrid|chiller|due on/.test(heard)) {
    return { type: "copilot", question: raw.trim(), speak: "Asking the building from cited evidence." };
  }

  const asset = best(heard, ctx.assets);
  if (asset && scoreHit(heard, asset) >= 40) {
    return { type: "open-asset", assetId: asset.id, speak: `Opening ${asset.title}.` };
  }
  const task = best(heard, ctx.tasks);
  if (task && scoreHit(heard, task) >= 40) {
    return { type: "open-task", taskId: task.id, speak: `Opening ${task.title}.` };
  }

  return {
    type: "unknown",
    speak: "Try open AHU-2, start task, next step, take photo, read back, voice note, flag issue, or create work order.",
  };
}
