# CSMS Field — decision record

Owner decisions that change scope, ownership or authority. Append new entries; do not rewrite old ones.

## D-001 — Product ownership and pilot operator (2026-10-01)

- **Decision:** Apex Prometheus owns the CSMS Field product and its reusable IP. Churchill is the pilot operator.
- **Source:** owner instruction in a Claude Code session, 2026-10-01 ("apex owns churchill pilots").
- **Resolves:** the open "entity/brand ownership" item in `attachments/00-csbs-knowledge-pack-digest.md` §4.
- **Assumption:** "Churchill" means **Churchill Pro Solutions**, the facility-maintenance company, as proposed in the digest. Confirm or correct.
- **Boundary:** this is an operating decision. It is not a legal IP assignment, license, contract or entity change. Any written IP-transfer or licensing language still needs owner approval.
- **Follow-on:** the research corpus outside this repo still files the product under Churchill Painting Corp. Re-tagging it is a separate task for the corpus owner.

## D-002 — Repository visibility (2026-10-01)

- **Decision:** make this repository private.
- **Why:** the knowledge-pack digest exposes internal Drive references, machine paths, job IDs and an owner email.
- **Status:** requested by the owner. Not confirmed from this session; whoever changes the setting should record the date here.

## D-003 — Development moves to a private working copy (2026-10-01)

- **Decision:** active development moves to `Apex-Blue-Collar/csms-field-claude` (private), with Claude as the builder of record. This repository stays as the original Grok-built prototype and is not changed further, apart from this note.
- **Copy:** full git history up to `34d7ac2`, plus the build plan. Later decisions (D-004 onward) and the current build plan live in the copy.
- **Status:** pending. The owner creates the empty private repository, then Claude pushes the copy. Until then, the plan v1 at commit `e0482a5` is the latest published version.
