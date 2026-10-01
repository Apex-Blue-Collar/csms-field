# CSMS Field — build plan: prototype → pilot-ready

- **Status:** draft for owner review.
- **Owner:** Apex Prometheus (D-001). **Pilot operator:** Churchill (assumed Churchill Pro Solutions).
- **Baseline:** commit `34d7ac2` on `main`.
- **Non-negotiable, unchanged:** read-only. No BMS writes. The live connector stays stubbed and locked. Existing controllers keep PID loops, safeties, interlocks, freeze protection, smoke/fire control, emergency shutdowns and fallback sequences.

## 1. Where the prototype stands

The screens and domain model are good and worth keeping: tasks, evidence, fault cards with visible score math, passports, work-order export, voice. The rest is simulated.

| Area | Today | Gap |
|---|---|---|
| Identity | Better Auth wired to Grok's auth broker; `VITE_AUTH_ENABLED=false`. "Switch people in Settings." | No real users, sessions or roles. |
| Data | Everything lives in a Zustand store persisted to the browser (`src/lib/store.ts`). The server DB holds only auth tables. | No shared record. Data is per-device and editable. |
| Company isolation | `setBuilding` refuses a cross-company switch in the UI. | Not enforced anywhere a user can't bypass. |
| Audit | `tryDeleteAudit` returns false. `resetDemo` wipes everything. | Not append-only in any real sense. |
| Offline / sync | An airplane-mode toggle. `syncNow` marks the queue synced and fabricates a conflict against `"unchanged-server"`. No service worker. | No offline app shell, no server, no real conflicts. |
| Copilot | `localCopilot` matches regexes against seed IDs and returns pre-written answers. | No retrieval and no model, so it can't answer about real data. |
| Model routing | `local` / `redacted` / `public` setting and an admin policy flag exist. Nothing reads them. | CSBS-B03 (hosted-model policy) is unresolved. |

## 2. Decisions needed before building (owner)

Each has a recommendation. Items marked **gate** need owner approval under the fleet approval rules (credentials, spend, production).

1. **Builder of record.** The repo is a Grok app-builder workspace (`.grok/`, `connectors.grok.me`, Grok auth broker, preview bridge). If Grok's builder keeps editing while Claude or Codex do too, two writers own one resource.
   *Recommend:* repo-driven development from Phase 1 on. Grok's builder stops writing to `main`.
2. **Identity provider (gate).** Keep Grok's broker or run our own.
   *Recommend:* our own Better Auth (already a dependency) with Google sign-in under an Apex-owned OAuth client, plus email invites. This removes the Grok broker and `GROK_*` connector dependency. Needs a new OAuth client.
3. **Hosting and database (gate).** Vercel + Neon Postgres is already wired through `DATABASE_URL`.
   *Recommend:* keep it, under an Apex-owned Vercel team and Neon project. Add Vercel Blob for photos.
4. **Hosted model (gate, spend).** Settles CSBS-B03.
   *Recommend:* default stays `local` (no model call). An admin can enable `redacted` per company. Use the Claude API under an Apex account with a monthly spend cap. `public` stays off for the pilot.
5. **Pilot data (CSBS-Q01).**
   *Recommend:* run the pilot on synthetic data or an approved offline dataset first, per the CSBS "first proof is offline, not a live high-rise" rule. A real building waits for Q01, Q02 and Q03.

## 3. Phases

Sizes: S = days, M = 1–2 weeks, L = 2–4 weeks of focused build. Each phase merges behind its own PR with tests.

### Phase 1 — Real identity and tenancy (M)

- Migration `0002_tenancy.sql`: `companies`, `memberships (user_id, company_id, role)`, `buildings`, `invites`.
- One server chokepoint, `requireMember(companyId, capability)`, used by every server function. Never trust a client-sent company ID.
- Capability matrix by role (technician, engineer, reviewer, reader, admin). Examples: only engineer/reviewer approve mappings and passports; only admin changes routing policy; readers export nothing.
- Keep the seed buildings as a `demo` company, so demos work without touching pilot data.
- Remove "switch people in Settings" outside demo mode.

**Done when:** tests prove a Harbor user cannot read, write or export Atlas records through any server function, and every role check has a test.

### Phase 2 — Server-side record (L)

- Move the entities in `src/lib/types.ts` to Postgres: assets, points, trend samples, alarms, documents, passports, PM templates and tasks, task evidence, voice notes, fault cards, work orders, commissioning packets, imports, quality issues, audit events, copilot messages. Every row carries `company_id` and `building_id`.
- **Append-only audit enforced in the database:** a trigger rejects `UPDATE` and `DELETE` on `audit_events`, and each row stores `prev_hash` so tampering is detectable. `resetDemo` only touches the demo company.
- Evidence photos go to blob storage, keyed by content hash. Rows store the hash and metadata. Original voice transcripts stay immutable (keep `applyTranscriptEdit` semantics).
- CSV adapters (`runAdapter`) run server-side and store the source file hash and importer.
- Retention: state per table how long evidence, trends and audit are kept. Nothing is deleted automatically in the pilot.
- The client reads through TanStack Query. Zustand keeps only UI and session state.

**Done when:** two devices signed in as the same user see the same record, and a direct SQL delete on audit fails.

### Phase 3 — Offline capture and real sync (L)

- Service worker caches the app shell, so the app opens in a mechanical room with no signal. Today there is none.
- IndexedDB outbox, not localStorage (photos won't fit). Each operation carries a client UUID (idempotency key), device ID, user, timestamp and the record version it was based on.
- `POST /api/sync/push` applies operations idempotently: a replayed operation is a no-op. `GET /api/sync/pull?cursor=` returns changes for the user's companies since the cursor.
- **Conflict rules:**
  - Evidence (photos, readings, voice notes, checklist ticks) is additive and never conflicts. Both sides are kept.
  - Mutable fields (task status, work-order fields, mapping review state) carry a version. A stale base version creates a conflict row. Nothing is overwritten silently. The existing conflict UI resolves it, and the resolution is audited.
- Sync status on Today: queued count, last sync, unresolved conflicts.

**Done when:** two phones in airplane mode close the same task with different readings, both reconnect, no evidence is lost, exactly one conflict appears, and replaying the outbox changes nothing.

### Phase 4 — Copilot with real retrieval and routing (M)

- **Server-side retrieval:** for a question, gather a scoped evidence bundle (building, asset, time window) of points, trends, alarms, document excerpts, tasks and fault cards. The bundle uses the same `Citation` shape as today.
- **`local`** (default): deterministic answers built from the bundle, generalizing today's engine beyond hard-coded IDs. No model call.
- **`redacted`** (admin opt-in per company): the hosted model receives the bundle with people, company, building names and addresses replaced by tokens, then mapped back.
- **`public`:** disabled for the pilot.
- **Citation guard:** the model may cite only IDs in the bundle. The server rejects any other citation and downgrades the answer to `needs-source`. Keep the "observed vs hypothesis" and "missing source" fields.
- **Logging:** routing mode, model, token counts, cost and bundle hash go to the audit log. Prompt and response bodies are not stored by default.
- **Evals** run in CI against synthetic data:
  - the four demo questions;
  - "what changed after the chiller repair" must return missing-source;
  - a cross-company question must return nothing;
  - a prompt asking for a setpoint change must refuse.

**Done when:** evals pass in `local` and `redacted`, and no hosted call happens unless the company's policy flag is on.

### Phase 5 — Pilot readiness (S–M)

- Churchill pilot company set up with invited users and roles. Synthetic or approved offline dataset loaded (decision 5).
- Security review of auth, tenancy, sync and copilot. Dependency audit. Backup and restore drill on Neon.
- Error monitoring and a basic uptime check.
- Short field guide for technicians: install to home screen, offline capture, closing a task with evidence.
- Pilot acceptance checklist signed by the owner before any real building data enters.

## 4. Out of scope for this plan

- Any live BMS connection, credentials to building systems, or OT-network access.
- Any setpoint, schedule or command write. Future writeback requires the full CSBS approval chain plus shadow mode, whitelists, bounds, expiry, rollback, audit, manual override and kill switch.
- Anomaly models. Deterministic rules come first, per the CSBS learning order.
- Native app store builds. The PWA stays the shell.
- Real HVAC thresholds and intervals. They stay `placeholder, engineer must set` until a named controls engineer (CSBS-Q03) signs them.

## 5. Order of work

1. Owner answers decisions 1–5 and confirms the repo is private.
2. Phase 1 → Phase 2 → Phase 3 → Phase 4, each its own PR. Phase 4 retrieval can start once Phase 2 tables exist.
3. Phase 5, then the pilot with owner sign-off.
