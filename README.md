# CSMS Field

Voice-enabled, read-only preventive-maintenance app for engineers standing in a mechanical room.

Working title only. Product name is an owner decision.

**Read-only. PM-first. No BMS writes.** Existing controllers keep PID loops, safeties, interlocks, freeze protection, smoke/fire control, emergency shutdowns, and fallback sequences.

## What you can do

- Today: Starlink-style building status, next task, fault cards, data quality
- Execute a PM task one-handed: steps, hold-to-talk, photo, readings, close with evidence
- Asset registry with native vendor IDs beside canonical names
- Evidence-backed fault cards with visible score math
- CMMS-ready work orders (CSV / JSON / PDF)
- Operator copilot that answers only from cited evidence
- Agnostic onboarding for a Trane-style supervisor export and a Gree-style VRF register map
- Offline (airplane mode) capture with sync and a conflict log
- Append-only audit. Deletes fail.

## Seed buildings (synthetic)

1. **Riverside Tower** — Harbor Point Properties — Trane Tracer-style AHU + 3 VAVs
2. **East River Residences** — Atlas Facilities — Gree ME30 gateway / CE52 VRF

Company isolation is enforced. Switch people in Settings.

## Control boundary

There is no write service, no connector credentials, and no live BMS path. The live connector stub returns `blocked_requires_winston_approval`.

Engineering intervals, setpoints, persistence, and deadbands are data fields. Placeholder templates render **placeholder, engineer must set**.

## Model routing

Default **local**. Building data does not go to a hosted model unless an admin sets the policy flag (CSBS-B03 is unresolved).

## Stack

Cross-platform PWA (iOS / Android home screen) from one web codebase. Offline store in the browser. Deployed as a Vercel web app now; the same UI is the native-app shell later.
