import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Panel, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/onboard")({ component: Onboard });

function Onboard() {
  const nav = useNavigate();
  const setBuilding = useAppStore((s) => s.setBuilding);
  const setUser = useAppStore((s) => s.setUser);
  const [step, setStep] = useState(1);
  return (
    <div>
      <ScreenTitle kicker={`Step ${step} of 4`} title="Onboard a building" />
      <div className="space-y-4 px-5 pb-8">
        {step === 1 && (
          <>
            <p className="text-sm text-muted">Vendor-agnostic. Pick a seed profile or stay on the current building.</p>
            <div className="grid gap-2">
              <Button variant="quiet" className="h-16 justify-start" onClick={() => { setUser("u_maya"); setBuilding("b_riverside"); setStep(2); }}>Harbor / Trane · Riverside Tower</Button>
              <Button variant="quiet" className="h-16 justify-start" onClick={() => { setUser("u_priya"); setBuilding("b_eastriver"); setStep(2); }}>Atlas / Gree · East River Residences</Button>
            </div>
          </>
        )}
        {step === 2 && <Panel className="px-4 py-4 text-sm text-muted">Import is offline CSV. Live connector stays locked until Winston, a controls engineer, and OT security approve.</Panel>}
        {step === 3 && <Panel className="px-4 py-4 text-sm text-muted">Twelve-field evidence passport is required before mapping can be approved. AI labels stay proposed until a human decides.</Panel>}
        {step === 4 && <Panel className="px-4 py-4 text-sm text-muted">No BMS writes. Existing controllers keep the building. Install as a PWA on a phone until native shells exist.</Panel>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="quiet" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Button>
          <Button onClick={() => { if (step < 4) setStep((s) => s + 1); else nav({ to: "/" }); }}>{step < 4 ? "Continue" : "Enter field"}</Button>
        </div>
      </div>
    </div>
  );
}
