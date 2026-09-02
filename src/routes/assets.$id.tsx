import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AiMark, Divider, Panel, ScreenTitle } from "@/components/bits";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/assets/$id")({ component: AssetDetail });

function AssetDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const asset = useAppStore((s) => s.assets.find((a) => a.id === id));
  const assets = useAppStore((s) => s.assets);
  const points = useAppStore((s) => s.points).filter((p) => p.assetId === id);
  const docs = useAppStore((s) => s.documents);
  const people = useAppStore((s) => s.people);
  const quality = useAppStore((s) => s.quality).filter((q) => q.assetId === id);
  if (!asset) return <p className="px-5 text-muted">Asset not in this company.</p>;
  const linked = docs.filter((d) => d.linkedAssetIds.includes(asset.id));
  const trail: string[] = [];
  let cur = asset;
  const seen = new Set<string>();
  while (cur.parentId && !seen.has(cur.id)) {
    seen.add(cur.id);
    const parent = assets.find((a) => a.id === cur.parentId);
    if (!parent) break;
    trail.unshift(parent.canonicalName);
    cur = parent;
  }
  return (
    <div>
      <ScreenTitle kicker={asset.kind} title={asset.canonicalName} />
      <div className="space-y-4 px-5 pb-8">
        <Panel className="px-4 py-4">
          <p className="label-kicker">Path</p>
          <p className="mt-1 text-sm text-muted">{trail.length ? trail.join(" / ") : "Root"}</p>
          <p className="mt-3 label-kicker">Native ID</p>
          <p className="mt-1 font-mono text-sm">{asset.nativeId}</p>
          <p className="mt-3 label-kicker">Haystack / Brick</p>
          <p className="mt-1 text-sm text-muted">{asset.haystackTags.join(", ") || "—"} · {asset.brickClass}</p>
          {asset.passportId && (
            <button type="button" className="mt-3 text-sm text-ok" onClick={() => nav({ to: "/passport" })}>Evidence passport {asset.passportId}</button>
          )}
        </Panel>
        {quality.length > 0 && (
          <Panel className="px-4 py-4">
            <p className="label-kicker">Quality on this node</p>
            {quality.map((q) => <p key={q.id} className="mt-2 text-sm text-warn">{q.message}</p>)}
          </Panel>
        )}
        <Panel>
          {points.length === 0 && <p className="px-4 py-4 text-sm text-muted">No points on this node.</p>}
          {points.map((p, i) => {
            const who = people.find((u) => u.id === p.importedBy)?.name ?? p.importedBy;
            return (
              <div key={p.id} className="px-4 py-3">
                {i > 0 && <Divider />}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.canonicalName}</p>
                    <p className="font-mono text-[11px] text-muted">{p.nativeId} · {p.lastValue} {p.unit} · {p.quality}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-faint">
                      {p.sourceFile} · hash {p.sourceHash} · imported {p.importDate.slice(0, 10)} by {who}
                    </p>
                  </div>
                  <AiMark label={p.mapping.aiLabel} />
                </div>
              </div>
            );
          })}
        </Panel>
        <Panel className="px-4 py-4">
          <p className="label-kicker">Change history</p>
          {asset.changeHistory.length === 0 && <p className="mt-2 text-sm text-muted">No rename or swap recorded. History stays with the native ID.</p>}
          {asset.changeHistory.map((h, i) => (
            <p key={`${h.at}-${i}`} className="mt-2 text-sm">
              {h.field}: {h.from} → {h.to}
              <span className="mt-0.5 block text-xs text-muted">{h.at.slice(0, 10)} · {people.find((u) => u.id === h.by)?.name ?? h.by}</span>
            </p>
          ))}
        </Panel>
        {linked[0] && (
          <Panel className="px-4 py-4">
            <p className="label-kicker">Documents</p>
            {linked.map((d) => (
              <p key={d.id} className="mt-2 text-sm">{d.title}<span className="block text-xs text-muted">{d.section} · {d.fileName} · {d.hash.slice(0, 8)}</span></p>
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}
