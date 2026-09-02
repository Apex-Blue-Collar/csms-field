---
type: project-knowledge-pack
project: Churchill Smart Building Systems (CSBS)
package_id: CSBS-BMS-ENGINEERING-RESEARCH-20260901-V1
compiled: 2026-09-01
compiled_by: Claude (Master Prompt Architect project) from Drive-indexed corpus content
source_of_truth: the package files themselves; this digest is an index and summary, not a replacement
---

# CSBS Research Knowledge Pack v1

## 1. Where the research lives

The "fleet mailbox" is a Google Drive folder, not an email inbox. Construction Hermes (machine CHILL1, profile chillchief) deposited the complete corpus on 2026-09-01 at Winston's request.

- **Folder:** `My Drive (stan@churchillpaintingcorp.com)/Fleet Exchange/BUS/packages/CSBS-BMS-ENGINEERING-RESEARCH-20260901-V1/`
- **ZIP:** same path + `.zip` — 1,213,678 bytes — Drive file ID `131bteBC-ZfixfpfSeyIHPQLrqj07pdAX`
- **ZIP SHA-256:** `7dd245732f5597cf9f52d77e16f7004365585843b0f7c5a716f46378c5949df7`
- **Manifest:** `MANIFEST.json` — Drive file ID `1ujpEXsL5ggrJqtM7SgXiQpqvuwkWMGOo` — 45 source files, SHA-256 per file
- **Manifest SHA-256:** `abcbf3511394233eb33886bc6f0bccf0ceabd876d6733adb1737ce66723dc12c`
- **Local origin on CHILL1:** `C:/Genisis Chill/01 - Business/Churchill Painting Corp/Projects/Churchill Smart Building Systems/`
- **Weekly loop:** Hermes job `Churchill Smart Building Systems Weekly BMS Learning Loop`, ID `6bbc448f89e4`, Sundays 08:30 EDT, next run 2026-09-06. New cycles land in `Learning Loop/` and should be re-packaged into the project after each run.

## 2. Package contents (from MANIFEST.json and folder listing)

**Project Corpus/**
- `00 Churchill Smart Building Systems - Project Design.md` — controlling source
- `01 Churchill Smart Building Systems - Implementation Plan.md`
- `02 Churchill Smart Building Systems - Project Board.md` — 7-column Obsidian kanban
- `03 Board and Handoff Verification Receipt.md`
- `04 BMS Learn Loop Verification Receipt.md`
- `05 Manufacturer NYC Learning Scope Correction Receipt.md`

**Project Corpus/Handoffs/** (Drive folder `1Fx5mvlLl642GFDy7NNcx2BIvu5SmYnTp`)
- `00 Handoff Pack Index.md` — run order
- `01 Product and Market Strategy Handoff.md`
- `02 BMS Controls Architecture Handoff.md`
- `03 PM and AFDD Engineering Handoff.md`
- `04 Semantic Data and Digital Twin Handoff.md`
- `05 OT Cybersecurity Handoff.md`
- `06 Pilot and Evaluation Handoff.md`
- `07 Red Team and Synthesis Handoff.md`
- `08 Grok BMS Learning Handoff.md` — ready-to-paste Grok prompt

**Learning Loop/** (Drive folder `1ddhsnYH6Kt8UQ1ldTp-ykPndizx4VCZ1`)
- `00 BMS Learning Loop Index.md`
- `Cycle 001 - Field Map and Offline Pilot Foundation - 2026-08-31.md`
- `Cycle 002 - Trane Daikin Gree NYC BMS Foundation - 2026-09-01.md`
- `Skill Tests/` — RED baseline, GREEN skill-loaded test, comparison

**Research/**
- `BMS Engineering + AI Hermes Opportunity Map - 2026-08-31.md` — source-bound (NIST, DOE, ASHRAE, BACnet, Haystack, Brick, CISA)
- Source PDFs (count per manifest)

**Skills/**
- `building-management-systems-ai/SKILL.md` v1.0.0 — generic class-level doctrine
- `churchill-smart-building-systems-learning/SKILL.md` v1.0.0 — Churchill-specific learning loop

**Fleet history cards** — `2026-08-31-2235-chillchief-...board-handoffs-ready.md`, `2026-09-01-chillchief-complete-bms-engineering-research-package.md`, `churchill-smart-building-systems-2026-08-31.md` (pattern card)

## 3. What the corpus decided (Winston-approved, 2026-08-31 / 09-01)

**Product:** AI-assisted preventive-maintenance and engineering overlay for existing BMS/BAS in commercial buildings, residential high-rises, institutional facilities.

**Product promise — the operator gets:** what appears wrong · why it matters · what evidence supports it · which equipment and spaces are affected · what to check in the field · which trade owns it · what verification closes it.

**Strategy, in order:** PM-first → read-only/offline-first → deterministic engineering rules before anomaly models → evidence-backed AFDD and prioritization → PM tasks, CMMS-ready work orders, commissioning packets, operator briefs → Haystack/Brick semantic foundation → digital-twin-ready architecture → **no autonomous control in version one**.

**Five product lanes:** (1) data and semantic foundation; (2) AI-assisted PM; (3) deterministic AFDD + operator copilot; (4) workflow and proof layer; (5) commercial pilot and repeatable package.

**Learning order (Cycle 001):** BMS architecture and point-data quality → semantic normalization → deterministic PM/FDD rules → offline simulation and fault adjudication → operator work-order workflow → real-building read-only pilot → digital twin and bounded optimization last.

**First equipment:** AHU + VAV. **First proof:** approved offline dataset or BOPTEST-style simulation, not a live high-rise.

**Winston's scope correction (Cycle 002):** curriculum centers on Trane, Daikin (voice term "darken," assumed Daikin), Gree, NYC commercial/residential high-rise systems, and practical BMS engineering. Generic BMS is supporting context only.

**Cycle 002 findings (source-bound):**
- Trane Tracer SC+ supports Trane and non-Trane equipment over BACnet, LonTalk, Modbus — but "supports BACnet" does not prove every point/trend/alarm/schedule is exposed identically across generations. Adapter profile must record SC/SC+/Synchrony version, controller families, native vs bridged protocols, export path, license dependencies, source document + revision.
- Daikin Applied's integration library is organized by equipment family and MicroTech controller generation with separate BACnet/Modbus/LonWorks documents. Bind model + controller generation + protocol guide before any PM/fault logic. No generic "Daikin chiller points" library.
- Gree ME30-24/D1(BM) gateway: Modbus RTU, Modbus TCP, BACnet/IP for multi-VRF. CE52-24/F(C) central controller: up to 16 outdoor / 255 indoor units. This is an equipment-level VRF gateway pattern, not an enterprise BMS supervisor. Separate indoor/outdoor network, central controller, gateway, third-party supervisor, and actual read/write authority.
- NYC: LL97 covers buildings over 25,000 gsf, limits from 2024, stricter 2030. 2025 NYCECC and 2025 NYC ASHRAE 90.1 enforcement began 2026-03-30 with expanded existing-building and documentation/testing requirements. Frame BMS value as operations, PM, fault evidence, commissioning support, measurement data — not automatic compliance.
- Manufacturer evidence profiles, not one generic connector: normalize into one PM/AFDD workflow while preserving native IDs, protocols, versions, and documents.

**Knowledge model (Cycle 001):** Layer A building/equipment hierarchy (site → floor/zone → system → equipment → component → sensor/actuator/meter → controller/gateway); Layer B operational data (point identity, unit, value/timestamp, quality/stale flag, command vs status, trend, alarm/event, override); Layer C engineering intent (sequence, setpoint/reset, schedule/occupancy, safety/interlock boundary, acceptance test, manufacturer constraint); Layer D maintenance/fault workflow (PM task, fault candidate, evidence window, confidence, impact, field check, responsible trade, work order, verification, adjudication).

**Reference architecture (Project Design):** sensors/equipment → local controllers (safeties + deterministic sequences stay here) → existing BMS supervisor/historian → approved read-only connector or offline export → raw point registry + time-series store + document store → Haystack/Brick mapping + equipment graph → deterministic rules + anomaly models + PM engine → Hermes orchestration + frontier-model reasoning → fault card / PM task / work order / commissioning packet → engineer or operator review and approval.

**Fault prioritization order:** life safety or equipment protection → occupant comfort/IAQ → energy and demand cost → equipment wear/failure risk → confidence and evidence quality → ease/cost of correction → classification (controls change / field repair / engineering question).

**Control boundary (non-negotiable, every document):** existing controllers retain PID loops, safeties, interlocks, freeze protection, smoke/fire control, emergency shutdowns, fallback sequences. Blocked without explicit authority: live BMS connection, credentials, confidential building data, OT-network probing, external/customer/vendor outreach, paid tools, network changes, controller/setpoint writes. Future writeback requires owner + controls engineer + operator + OT security + Winston, plus shadow mode, whitelists, hard bounds, expiry, rollback, audit logs, manual override, kill switch.

**Multi-model research pattern (Handoff Pack Index):** Wave 1 — product strategy + controls architecture through different frontier models; Wave 2 — PM/AFDD + semantics + cybersecurity + pilot; Wave 3 — independent red-team reviewer with the six unedited outputs. Preserve provider/model, date, exact prompt, supplied sources, tool availability, verbatim output. Compare before synthesis; never smooth contradictions.

**Stop conditions in use:** `blocked_requires_winston_decision` · `blocked_missing_bms_source` · `blocked_requires_controls_engineer` · `blocked_requires_platform_source`.

## 4. Open decisions on the board (owner: Stan)

1. **CSBS-Q01** — Select first building/use case: commercial, residential high-rise, institutional, or approved test dataset. `blocked_requires_winston_decision`
2. **CSBS-Q02** — Identify the likely BMS platform (Niagara / Metasys / Desigo / EcoStruxure / ALC / Trane / Honeywell / other). `blocked_missing_bms_source`
3. **CSBS-Q03** — Name the controls-engineering authority who validates sequences and approves live-system decisions. `blocked_requires_controls_engineer`
4. **Entity/brand ownership** — corpus files the product under Churchill Painting Corp and flags ownership "unconfirmed beyond the project name." Org keystone v1.3 says licensable IP lives on the AI side. **⚠️ DECISION NEEDED:** confirm Apex Prometheus Labs as IP owner with Churchill Pro Solutions as pilot operator, and tell Hermes to re-tag the corpus.
5. **Frontier-model handoffs** — none of the 7 (or the Grok #08) has been executed yet. Board cards CSBS-R01 through R04 are Ready.
6. **"Darken" = Daikin** — assumed, not confirmed.

## 5. How this project passes research to other agents

Ray Delgado (project persona) is the instruction hub. Flow:

1. Stan asks Ray for a research or build task.
2. Ray emits an **AGENT HANDOFF PACKET** (format F) naming the recipient — Grok, ChatGPT, Hermes — with the corpus files to attach, or a **BUILD PACKET** (format E) for Claude Code / Codex.
3. Stan pastes the packet into the recipient with the named attachments from the Drive package.
4. Recipient's verbatim output goes back into the project as an artifact (and into `Learning Loop/` on CHILL1 for Hermes to reconcile in the next cycle).
5. Ray reconciles against the controlling source, marks agreements / contradictions / unsupported claims, and updates the decision list — never smoothing disagreements.
6. Anything that generalizes gets a T1 flag and placeholders for the Labs inventory.

Hermes delivery path back to the fleet: drop files into `Fleet Exchange/BUS/packages/` with a manifest; Construction Hermes picks them up on the Sunday loop.

## 6. Related artifact from this session

- `bms-pm-program-panel-project-setup.md` (2026-09-01, Drive ID `1HmEl5-kOvUq4lw8VL1MNAaPfkZDiPICR`) — the seven-seat panel version. Superseded by the Ray Delgado single-persona project for CSBS; keep as the T1 "BMS & PM Program Panel" template.
