import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Divider, Kicker, Panel, Row, ScreenTitle } from "@/components/bits";

export const Route = createFileRoute("/more")({ component: More });

function More() {
  const nav = useNavigate();
  const go = (to: string) => () => nav({ to });
  return (
    <div>
      <ScreenTitle kicker="CSMS" title="More" />
      <div className="space-y-6 px-5 pb-6">
        <section>
          <Kicker>Program</Kicker>
          <Panel className="mt-2">
            <Row title="Fault cards" meta="Evidence, score math, adjudication" onClick={go("/faults")} />
            <Divider />
            <Row title="Work orders" meta="CMMS-ready CSV, JSON, PDF" onClick={go("/work-orders")} />
            <Divider />
            <Row title="Briefs" meta="Daily due, overdue, quality — export" onClick={go("/briefs")} />
            <Divider />
            <Row title="Commissioning" meta="Human sign-off only" onClick={go("/commission")} />
          </Panel>
        </section>
        <section>
          <Kicker>Data</Kicker>
          <Panel className="mt-2">
            <Row title="Documents" meta="Sequences, manuals, protocol notes" onClick={go("/documents")} />
            <Divider />
            <Row title="Import" meta="CSV · live connector locked" onClick={go("/import")} />
            <Divider />
            <Row title="Mapping review" meta="Blocked until the 12-field passport is complete" onClick={go("/mapping")} />
            <Divider />
            <Row title="Evidence passports" meta="Twelve fields, all required" onClick={go("/passport")} />
            <Divider />
            <Row title="Data quality" meta="Stale, orphan, missing trends" onClick={go("/quality")} />
          </Panel>
        </section>
        <section>
          <Kicker>System</Kicker>
          <Panel className="mt-2">
            <Row title="Onboarding" meta="Agnostic wizard · two seed profiles" onClick={go("/onboard")} />
            <Divider />
            <Row title="Audit log" meta="Append-only · deletes fail" onClick={go("/audit")} />
            <Divider />
            <Row title="Offline & conflicts" meta="Airplane mode, queue, human resolution" onClick={go("/settings")} />
            <Divider />
            <Row title="Settings" meta="Role, routing, isolation, install" onClick={go("/settings")} />
          </Panel>
        </section>
        <p className="px-1 text-xs leading-relaxed text-faint">
          Install from the browser menu: Add to Home Screen. Native iOS and Android shells come later — this is the field PWA.
        </p>
      </div>
    </div>
  );
}
