import { createFileRoute } from "@tanstack/react-router";
import { Panel, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import type { AdapterKind } from "@/lib/engines";
import { useAppStore } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/import")({ component: ImportScreen });

function ImportScreen() {
  const apply = useAppStore((s) => s.applyImport);
  const tryLive = useAppStore((s) => s.tryLiveConnector);
  const records = useAppStore((s) => s.imports);
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const [kind, setKind] = useState<AdapterKind>("trane-csv");
  const [text, setText] = useState("native_id,name,unit,role,value\nAHU2.SA.T,SAT,°F,sensor,63.1");
  const [msg, setMsg] = useState("");
  return (
    <div>
      <ScreenTitle kicker="Adapters" title="Import" />
      <div className="space-y-4 px-5 pb-8">
        <p className="text-sm text-muted">Offline CSV, BACnet object lists, historian exports. Live connector is locked.</p>
        <div className="flex flex-wrap gap-2">
          {(["trane-csv", "gree-register-csv", "bacnet-object", "historian-export", "readonly-connector"] as AdapterKind[]).map((k) => (
            <Button key={k} variant={kind === k ? "primary" : "quiet"} onClick={() => setKind(k)}>{k}</Button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full rounded-xl bg-card px-3 py-2 font-mono text-xs outline-none shadow-[var(--shadow-border)]" />
        <Button className="w-full" onClick={() => {
          if (kind === "readonly-connector") { const r = tryLive(); setMsg(`${r.code}: ${r.message}`); return; }
          setMsg(apply(kind, text).message);
        }}>Run adapter</Button>
        {msg && <p className="text-sm text-warn">{msg}</p>}
        <Panel className="px-4 py-4">
          {records.filter((r) => r.buildingId === buildingId).map((r) => (
            <p key={r.id} className="text-xs text-muted">{r.fileName} · {r.adapter} · {r.date.slice(0, 10)} · {r.hash.slice(0, 8)}</p>
          ))}
        </Panel>
      </div>
    </div>
  );
}
