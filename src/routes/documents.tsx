import { createFileRoute } from "@tanstack/react-router";
import { Panel, ScreenTitle } from "@/components/bits";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/documents")({ component: Documents });

function Documents() {
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const docs = useAppStore((s) => s.documents).filter((d) => d.buildingId === buildingId);
  return (
    <div>
      <ScreenTitle kicker="Sources" title="Documents" />
      <div className="space-y-3 px-5 pb-8">
        {docs.map((d) => (
          <Panel key={d.id} className="px-4 py-4">
            <p className="text-[15px] font-medium">{d.title}</p>
            <p className="mt-1 font-mono text-[11px] text-muted">{d.fileName} · {d.hash.slice(0, 8)} · {d.section}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{d.excerpt}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
