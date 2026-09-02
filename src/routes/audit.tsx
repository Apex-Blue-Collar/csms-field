import { createFileRoute } from "@tanstack/react-router";
import { Panel, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/audit")({ component: Audit });

function Audit() {
  const events = useAppStore((s) => s.audit);
  const userId = useAppStore((s) => s.currentUserId);
  const people = useAppStore((s) => s.people);
  const company = people.find((p) => p.id === userId)?.companyId;
  const tryDelete = useAppStore((s) => s.tryDeleteAudit);
  const mine = events.filter((e) => e.companyId === company);
  return (
    <div>
      <ScreenTitle kicker="Append-only" title="Audit" />
      <div className="px-5 pb-8">
        <Button variant="quiet" className="mb-3 w-full" onClick={() => tryDelete()}>Delete log</Button>
        <Panel className="space-y-3 px-4 py-3">
          {mine.slice(0, 40).map((e) => (
            <p key={e.id} className="text-xs leading-relaxed">
              <span className="font-mono text-faint">{e.at.slice(0, 16)}</span>
              <span className="ml-2 text-muted">{e.kind}</span>
              <span className="mt-0.5 block text-sm text-foreground">{e.summary}</span>
            </p>
          ))}
        </Panel>
      </div>
    </div>
  );
}
