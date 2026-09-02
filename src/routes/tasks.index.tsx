import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Panel, Row, ScreenTitle } from "@/components/bits";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/tasks/")({ component: Tasks });

function Tasks() {
  const nav = useNavigate();
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const tasks = useAppStore((s) => s.tasks).filter((t) => t.buildingId === buildingId);
  const assets = useAppStore((s) => s.assets);
  return (
    <div>
      <ScreenTitle kicker="Program" title="Tasks" />
      <div className="px-5 pb-8">
        <Panel>
          {tasks.map((t) => {
            const a = assets.find((x) => x.id === t.assetId);
            return (
              <Row key={t.id} title={t.title} meta={`${t.status} · ${t.dueAt.slice(0, 10)} · ${a?.canonicalName ?? ""}`}
                onClick={() => nav({ to: "/tasks/$id", params: { id: t.id } })} />
            );
          })}
        </Panel>
      </div>
    </div>
  );
}
