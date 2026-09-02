import { createFileRoute } from "@tanstack/react-router";
import { Panel, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/commission")({ component: Commission });

function Commission() {
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const list = useAppStore((s) => s.commissions).filter((c) => c.buildingId === buildingId);
  const sign = useAppStore((s) => s.signCommission);
  const [name, setName] = useState("");
  return (
    <div>
      <ScreenTitle kicker="Human only" title="Commissioning" />
      <div className="space-y-4 px-5 pb-8">
        <p className="text-sm text-muted">AI-proposed labels are not commissioning. A named human signs.</p>
        {list.map((c) => (
          <Panel key={c.id} className="px-4 py-4">
            <p className="text-[15px] font-medium">{c.title}</p>
            <p className="mt-1 text-sm text-muted">{c.preFunctional.filter((p) => p.done).length}/{c.preFunctional.length} pre-functional complete</p>
            {c.signOff ? (
              <p className="mt-3 text-sm text-ok">Signed {c.signOff.name} · {c.signOff.role} · {c.signOff.date.slice(0, 10)}</p>
            ) : (
              <div className="mt-3 space-y-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11 w-full rounded-xl bg-card-2 px-3 text-sm outline-none" />
                <Button className="w-full" onClick={() => sign(c.id, name, "engineer")}>Sign</Button>
              </div>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
