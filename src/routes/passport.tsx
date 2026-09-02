import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Divider, Panel, Pill, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { passportGaps } from "@/lib/engines";
import { PASSPORT_FIELDS, type EvidencePassport } from "@/lib/types";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/passport")({ component: Passport });

function Passport() {
  const nav = useNavigate();
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const all = useAppStore((s) => s.passports);
  const save = useAppStore((s) => s.savePassport);
  const list = all.filter((p) => p.buildingId === buildingId);
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <div>
      <ScreenTitle kicker="Twelve fields" title="Passports" />
      <div className="space-y-4 px-5 pb-8">
        <p className="text-[13px] leading-relaxed text-muted">Mapping is not truth until every field is filled. Drafts save. Approval waits.</p>
        {notice && <p className="text-[13px] text-warn">{notice}</p>}
        {list.map((p) => (
          <PassportCard key={p.id} initial={p} onSave={(next) => { const r = save(next); setNotice(r.ok ? "Passport complete. Mapping can be approved." : r.reason); }} onReview={() => nav({ to: "/mapping" })} />
        ))}
      </div>
    </div>
  );
}

function PassportCard({ initial, onSave, onReview }: { initial: EvidencePassport; onSave: (p: EvidencePassport) => void; onReview: () => void }) {
  const [draft, setDraft] = useState(initial);
  const gaps = passportGaps(draft as unknown as Record<string, string | undefined>);
  const filled = PASSPORT_FIELDS.length - gaps.filter((g) => g.key !== "passport").length;
  return (
    <Panel className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-medium">{draft.manufacturerProductFamily || "Unnamed family"}</p>
          <p className="mt-1 font-mono text-[11px] text-muted">{draft.id}</p>
        </div>
        {gaps.length === 0 ? <Pill tone="ok">Complete</Pill> : <Pill tone="warn">{filled}/12</Pill>}
      </div>
      <div className="mt-3">
        {PASSPORT_FIELDS.map((f, i) => {
          const empty = !String(draft[f.key] ?? "").trim();
          return (
            <div key={f.key}>
              {i > 0 && <Divider />}
              <label className="block py-2">
                <span className={`label-kicker ${empty ? "text-warn" : ""}`}>{f.label}</span>
                <textarea value={String(draft[f.key] ?? "")} rows={2} placeholder="Required"
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  className="mt-1.5 w-full resize-none rounded-xl bg-card-2 px-3 py-2 text-[13px] leading-snug outline-none shadow-[var(--shadow-border)] placeholder:text-faint" />
              </label>
            </div>
          );
        })}
      </div>
      <Button className="mt-2 w-full" onClick={() => onSave({ ...draft, reviewDate: draft.reviewDate || new Date().toISOString().slice(0, 10) })}>Save passport</Button>
      {gaps.length === 0 && <Button variant="quiet" className="mt-2 w-full" onClick={onReview}>Return to mapping</Button>}
    </Panel>
  );
}
