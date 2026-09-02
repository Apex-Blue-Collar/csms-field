import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Panel, ScreenTitle } from "@/components/bits";
import { useAppStore } from "@/lib/store";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/assets/")({ component: Assets });

function Assets() {
  const nav = useNavigate();
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const assets = useAppStore((s) => s.assets).filter((a) => a.buildingId === buildingId);
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const depth = useMemo(() => {
    const d = (id: string, seen = new Set<string>()): number => {
      const a = byId.get(id);
      if (!a || !a.parentId || seen.has(id)) return 0;
      seen.add(id);
      return 1 + d(a.parentId, seen);
    };
    return Object.fromEntries(assets.map((a) => [a.id, d(a.id)]));
  }, [assets, byId]);
  const pathOf = (id: string) => {
    const names: string[] = [];
    let cur = byId.get(id);
    const seen = new Set<string>();
    while (cur && cur.parentId && !seen.has(cur.id)) {
      seen.add(cur.id);
      const parent = byId.get(cur.parentId);
      if (!parent) break;
      names.unshift(parent.canonicalName);
      cur = parent;
    }
    return names.join(" / ");
  };
  const needle = q.trim().toLowerCase();
  const list = assets.filter((a) => !needle || a.canonicalName.toLowerCase().includes(needle) || a.nativeId.toLowerCase().includes(needle) || a.kind.includes(needle) || a.haystackTags.some((t) => t.includes(needle)));
  return (
    <div>
      <ScreenTitle kicker="Tree" title="Assets" />
      <div className="px-5 pb-8">
        <p className="mb-3 text-[13px] leading-relaxed text-muted">Site → floor → system → equipment. Native IDs stay beside the canonical name.</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search native ID, tag, name…"
          className="mb-3 h-11 w-full rounded-xl bg-card px-3 text-[15px] outline-none shadow-[var(--shadow-border)] placeholder:text-faint" />
        <Panel>
          {list.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => nav({ to: "/assets/$id", params: { id: a.id } })}
              className="press flex w-full min-h-14 items-center gap-3 py-3 pr-4 text-left"
              style={{ paddingLeft: 16 + (depth[a.id] ?? 0) * 14 }}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium leading-tight">{a.canonicalName}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">{a.nativeId} · {a.kind}{pathOf(a.id) ? ` · ${pathOf(a.id)}` : ""}</span>
              </span>
            </button>
          ))}
        </Panel>
      </div>
    </div>
  );
}
