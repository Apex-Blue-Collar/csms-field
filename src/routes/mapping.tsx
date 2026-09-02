import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AiMark, Divider, Panel, Pill, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { mappingApprovalGate, resolvePassport } from "@/lib/engines";
import { useAppStore } from "@/lib/store";
import type { ReviewState } from "@/lib/types";

export const Route = createFileRoute("/mapping")({ component: Mapping });

const FILTERS: { id: "proposed" | "all" | ReviewState; label: string }[] = [
  { id: "proposed", label: "Proposed" }, { id: "all", label: "All" }, { id: "approved", label: "Approved" },
  { id: "needs-source", label: "Need src" }, { id: "rejected", label: "Rejected" },
];

function Mapping() {
  const nav = useNavigate();
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const allPoints = useAppStore((s) => s.points);
  const assets = useAppStore((s) => s.assets);
  const passports = useAppStore((s) => s.passports);
  const people = useAppStore((s) => s.people);
  const userId = useAppStore((s) => s.currentUserId);
  const setUser = useAppStore((s) => s.setUser);
  const approve = useAppStore((s) => s.approveMapping);
  const buildings = useAppStore((s) => s.buildings);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("proposed");
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const building = buildings.find((b) => b.id === buildingId);
  const user = people.find((p) => p.id === userId);
  const can = user?.role === "engineer" || user?.role === "reviewer" || user?.role === "admin";
  const points = allPoints.filter((p) => p.buildingId === buildingId);
  const companyPeople = people.filter((p) => p.companyId === building?.companyId);
  const needle = q.trim().toLowerCase();
  const visible = points.filter((p) => {
    if (filter !== "all" && p.mapping.reviewState !== filter) return false;
    if (!needle) return true;
    const asset = assets.find((a) => a.id === p.assetId);
    return p.canonicalName.toLowerCase().includes(needle) || p.nativeId.toLowerCase().includes(needle) || (asset?.canonicalName.toLowerCase().includes(needle) ?? false);
  });
  const groups = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const p of visible) {
      const list = map.get(p.assetId) ?? [];
      list.push(p);
      map.set(p.assetId, list);
    }
    return [...map.entries()];
  }, [visible]);
  const proposed = points.filter((p) => p.mapping.reviewState === "proposed").length;

  return (
    <div>
      <ScreenTitle kicker="Human review" title="Mapping" />
      <div className="px-5 pb-8">
        <p className="mb-3 text-[13px] leading-relaxed text-muted">Native vendor IDs stay beside the canonical name. Approval is blocked until the twelve-field passport is complete.</p>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)}
              className={`h-9 shrink-0 rounded-full px-3 text-xs font-medium ${filter === f.id ? "bg-primary text-primary-foreground" : "bg-card text-muted shadow-[var(--shadow-border)]"}`}>
              {f.label}{f.id === "proposed" ? ` ${proposed}` : ""}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search native ID or name…"
          className="mb-3 h-11 w-full rounded-xl bg-card px-3 text-[15px] outline-none shadow-[var(--shadow-border)] placeholder:text-faint" />
        {!can && (
          <Panel className="mb-3 px-4 py-3">
            <p className="text-[13px] text-muted">You are {user?.role}. Mapping approval is an engineer or reviewer action.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {companyPeople.filter((p) => p.role === "engineer" || p.role === "reviewer").map((p) => (
                <Button key={p.id} variant="quiet" onClick={() => setUser(p.id)}>Review as {p.name.split(" ")[0]}</Button>
              ))}
            </div>
          </Panel>
        )}
        {notice && <p className="mb-3 text-[13px] text-warn">{notice}</p>}
        {groups.length === 0 ? <Panel className="px-4 py-6 text-sm text-muted">Nothing in this filter.</Panel> : groups.map(([assetId, pts]) => {
          const asset = assets.find((a) => a.id === assetId);
          const passport = resolvePassport(assetId, assets, passports);
          const gate = mappingApprovalGate({ assetId }, assets, passports);
          return (
            <div key={assetId} className="mb-4">
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[15px] font-medium">{asset?.canonicalName ?? assetId}</p>
                  <p className="font-mono text-[11px] text-muted">{asset?.nativeId}</p>
                </div>
                {gate.ok ? <Pill tone="ok">Passport complete</Pill> : <button type="button" onClick={() => nav({ to: "/passport" })}><Pill tone="warn">Passport blocked</Pill></button>}
              </div>
              {!gate.ok && (
                <button type="button" onClick={() => nav({ to: "/passport" })} className="mb-2 w-full rounded-xl bg-warn/10 px-3 py-2.5 text-left text-xs leading-snug text-warn">
                  Approval blocked: {gate.missing.map((m) => m.label).join("; ")}. Open passport{passport ? ` · ${passport.id}` : ""}.
                </button>
              )}
              <Panel>
                {pts.map((p, i) => (
                  <div key={p.id} className="px-4 py-3">
                    {i > 0 && <Divider />}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{p.canonicalName}</p>
                        <p className="font-mono text-[11px] text-muted">{p.nativeId} · {p.role} · conf {p.mapping.confidence.toFixed(2)}</p>
                        <p className="mt-1 text-[11px] text-faint">{p.sourceFile} · {p.sourceHash.slice(0, 8)}</p>
                      </div>
                      <AiMark label={p.mapping.aiLabel} />
                    </div>
                    {p.mapping.reviewState === "proposed" && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <Button variant="quiet" disabled={!can || !gate.ok} onClick={() => { const r = approve(p.id, "approved"); setNotice(r.ok ? null : `${r.reason}${r.missing.length ? " · " + r.missing.join("; ") : ""}`); }}>Approve</Button>
                        <Button variant="quiet" disabled={!can} onClick={() => { approve(p.id, "rejected"); setNotice(null); }}>Reject</Button>
                        <Button variant="quiet" disabled={!can} onClick={() => { approve(p.id, "needs-source"); setNotice(null); }}>Need src</Button>
                      </div>
                    )}
                  </div>
                ))}
              </Panel>
            </div>
          );
        })}
      </div>
    </div>
  );
}
