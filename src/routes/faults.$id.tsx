import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AiMark, Divider, Panel, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { scoreFault, scoreLines } from "@/lib/engines";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/faults/$id")({ component: FaultDetail });

function FaultDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const card = useAppStore((s) => s.faults.find((f) => f.id === id));
  const weights = useAppStore((s) => s.weights);
  const createWo = useAppStore((s) => s.createWorkOrder);
  if (!card) return <p className="px-5 text-muted">Card not found.</p>;
  const lines = scoreLines(card.flags, weights);
  const score = scoreFault(card.flags, weights);
  return (
    <div>
      <ScreenTitle kicker="Evidence card" title={card.title} />
      <div className="space-y-4 px-5 pb-8">
        <div className="flex items-center justify-between">
          <p className="text-3xl font-medium tabular">{score.toFixed(1)}</p>
          <AiMark label={card.aiLabel} />
        </div>
        <Panel className="space-y-3 px-4 py-4 text-sm">
          <p><span className="label-kicker block">What appears wrong</span>{card.whatAppearsWrong}</p>
          <p><span className="label-kicker block">Why it matters</span>{card.whyItMatters}</p>
          <p><span className="label-kicker block">Likely causes</span>{card.likelyCauses.join("; ")}</p>
          <p><span className="label-kicker block">Field checks</span>{card.fieldChecks.join("; ")}</p>
          <p><span className="label-kicker block">Rule basis</span>{card.ruleBasis}</p>
        </Panel>
        <Panel>
          {lines.map((l, i) => (
            <div key={l.key} className="px-4 py-2 text-sm">
              {i > 0 && <Divider />}
              <div className="flex justify-between"><span className="text-muted">{l.key}</span><span className="tabular">{l.part.toFixed(2)}</span></div>
            </div>
          ))}
        </Panel>
        <Button className="w-full" onClick={() => {
          const woId = createWo({ fromFaultId: card.id, equipmentId: card.assetIds[0], symptom: card.whatAppearsWrong, evidence: card.fieldChecks.join("; ") });
          nav({ to: "/work-orders/$id", params: { id: woId } });
        }}>Create work order</Button>
      </div>
    </div>
  );
}
