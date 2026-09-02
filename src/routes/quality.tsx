import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Panel, Row, ScreenTitle } from "@/components/bits";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/quality")({ component: Quality });

function Quality() {
  const nav = useNavigate();
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const items = useAppStore((s) => s.quality).filter((q) => q.buildingId === buildingId);
  return (
    <div>
      <ScreenTitle kicker="Health of the map" title="Data quality" />
      <div className="px-5 pb-8">
        <Panel>
          {items.map((q) => (
            <Row key={q.id} title={q.message} meta={q.kind}
              onClick={q.assetId ? () => nav({ to: "/assets/$id", params: { id: q.assetId! } }) : undefined} />
          ))}
        </Panel>
      </div>
    </div>
  );
}
