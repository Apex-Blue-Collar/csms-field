import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Panel, Row, ScreenTitle } from "@/components/bits";
import { scoreFault } from "@/lib/engines";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/faults/")({ component: Faults });

function Faults() {
  const nav = useNavigate();
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const weights = useAppStore((s) => s.weights);
  const faults = useAppStore((s) => s.faults).filter((f) => f.buildingId === buildingId);
  return (
    <div>
      <ScreenTitle kicker="Cards" title="Faults" />
      <div className="px-5 pb-8">
        <Panel>
          {faults.map((f) => (
            <Row key={f.id} title={f.title} meta={`score ${scoreFault(f.flags, weights).toFixed(1)} · ${f.adjudication} · ${f.aiLabel}`}
              onClick={() => nav({ to: "/faults/$id", params: { id: f.id } })} />
          ))}
        </Panel>
      </div>
    </div>
  );
}
