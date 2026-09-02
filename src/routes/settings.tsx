import { createFileRoute } from "@tanstack/react-router";
import { Divider, Kicker, Panel, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { liveConnectorStub } from "@/lib/engines";
import { useAppStore } from "@/lib/store";
import type { Role, RoutingMode } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";
import { useState } from "react";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const people = useAppStore((s) => s.people);
  const userId = useAppStore((s) => s.currentUserId);
  const setUser = useAppStore((s) => s.setUser);
  const setRole = useAppStore((s) => s.setRole);
  const allBuildings = useAppStore((s) => s.buildings);
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const setBuilding = useAppStore((s) => s.setBuilding);
  const settings = useAppStore((s) => s.settings);
  const setAirplane = useAppStore((s) => s.setAirplane);
  const syncNow = useAppStore((s) => s.syncNow);
  const setRouting = useAppStore((s) => s.setRouting);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const tryDelete = useAppStore((s) => s.tryDeleteAudit);
  const queueItems = useAppStore((s) => s.queue);
  const conflicts = useAppStore((s) => s.conflicts);
  const resolve = useAppStore((s) => s.resolveConflict);
  const setAlias = useAppStore((s) => s.setAlias);
  const user = people.find((p) => p.id === userId)!;
  const buildings = allBuildings.filter((b) => b.companyId === user.companyId);
  const pending = queueItems.filter((q) => !q.synced);
  const [notice, setNotice] = useState("");
  const [liveMsg, setLiveMsg] = useState("");

  return (
    <div className="pb-10">
      <ScreenTitle kicker="Control" title="Settings" />
      <div className="space-y-6 px-5">
        {notice && <p className="text-sm text-ok">{notice}</p>}
        <section>
          <Kicker>Session · demo stand-in for accounts</Kicker>
          <Panel className="mt-2 divide-y divide-border">
            <label className="block px-4 py-3">
              <span className="label-kicker">Person</span>
              <select value={userId} onChange={(e) => setUser(e.target.value)} className="mt-1 h-11 w-full rounded-xl bg-card-2 px-3 text-[15px] outline-none">
                {people.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.companyId === "co_harbor" ? "Harbor Point" : "Atlas"} · {ROLE_LABEL[p.role]}</option>)}
              </select>
            </label>
            <label className="block px-4 py-3">
              <span className="label-kicker">Role</span>
              <select value={user.role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 h-11 w-full rounded-xl bg-card-2 px-3 text-[15px] outline-none">
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </label>
            <label className="block px-4 py-3">
              <span className="label-kicker">Building in this company</span>
              <select value={buildingId} onChange={(e) => setBuilding(e.target.value)} className="mt-1 h-11 w-full rounded-xl bg-card-2 px-3 text-[15px] outline-none">
                {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          </Panel>
          <p className="mt-2 text-xs text-faint">Company isolation is enforced. Atlas people cannot open Riverside Tower.</p>
        </section>
        <section>
          <Kicker>Offline · airplane mode</Kicker>
          <Panel className="mt-2 px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[15px]">Airplane mode</span>
              <button type="button" onClick={() => setAirplane(!settings.airplaneMode)}
                className={`h-7 w-12 rounded-full p-0.5 ${settings.airplaneMode ? "bg-warn" : "bg-card-2 shadow-[var(--shadow-border)]"}`} aria-pressed={settings.airplaneMode}>
                <span className={`block size-6 rounded-full bg-primary transition-transform ${settings.airplaneMode ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {pending.length} unsynced field record{pending.length === 1 ? "" : "s"}. Captures never write the BMS. Field evidence is never silently dropped.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted">
              <li>Turn airplane on.</li>
              <li>Open a due task. Photo, reading, voice note.</li>
              <li>Turn airplane off. Reconnect and sync.</li>
              <li>Resolve the conflict log — keep local for field captures.</li>
            </ol>
            <Button variant="quiet" className="mt-3 w-full min-h-12" disabled={settings.airplaneMode} onClick={() => { syncNow(); setNotice("Sync complete. Local field captures kept. Conflict log updated."); }}>Reconnect and sync</Button>
            {pending.length > 0 && (
              <ul className="mt-3 space-y-2">
                {pending.slice(0, 8).map((i) => (
                  <li key={i.id} className="text-xs text-muted"><span className="font-mono text-faint">{i.at.slice(11, 16)}Z</span> · {i.action} · {i.detail || i.recordId}</li>
                ))}
              </ul>
            )}
          </Panel>
        </section>
        <section>
          <Kicker>Conflict log</Kicker>
          <Panel className="mt-2">
            {conflicts.length === 0 && <p className="px-4 py-4 text-sm text-muted">No conflicts. Capture offline, then sync to see one. Local evidence is the source of truth for field captures.</p>}
            {conflicts.map((c, i) => (
              <div key={c.id} className="px-4 py-4">
                {i > 0 && <Divider />}
                <p className="font-mono text-[11px] text-faint">{c.id}</p>
                <p className="mt-1 text-sm">{c.field} · local “{c.local}” vs remote “{c.remote}”</p>
                <p className={`mt-1 text-xs ${c.resolution === "unresolved" ? "text-warn" : "text-ok"}`}>{c.resolution}</p>
                {c.resolution === "unresolved" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button onClick={() => resolve(c.id, "kept-local")}>Keep local</Button>
                    <Button variant="quiet" onClick={() => resolve(c.id, "kept-remote")}>Keep remote</Button>
                  </div>
                )}
              </div>
            ))}
          </Panel>
        </section>
        <section>
          <Kicker>Install on a phone</Kicker>
          <Panel className="mt-2 px-4 py-4 text-sm leading-relaxed text-muted">
            <p>This is the field PWA. No store listing from this build.</p>
            <p className="mt-2">iOS Safari: Share → Add to Home Screen.</p>
            <p className="mt-1">Android Chrome: Menu → Add to Home Screen / Install app.</p>
            <p className="mt-2 text-xs text-faint">Full-screen, offline capture, hold-to-talk. Native shells come later.</p>
          </Panel>
        </section>
        <section>
          <Kicker>Voice aliases</Kicker>
          <p className="mt-2 text-xs leading-relaxed text-muted">Plant noise: keep aliases short. “photo” already maps to take photo.</p>
          <Panel className="mt-2 space-y-3 px-4 py-3">
            {Object.entries(settings.voiceAliases).map(([k, v]) => (
              <label key={k} className="block">
                <span className="label-kicker">{k}</span>
                <input value={v} onChange={(e) => setAlias(k, e.target.value)} className="mt-1 h-11 w-full rounded-xl bg-card-2 px-3 text-sm outline-none" />
              </label>
            ))}
          </Panel>
        </section>
        <section>
          <Kicker>Model routing · CSBS-B03 unresolved</Kicker>
          <Panel className="mt-2 px-4 py-4">
            <p className="text-[13px] text-muted">Default is local. Building data does not leave the device unless an admin sets the hosted policy flag.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["local", "redacted", "public"] as RoutingMode[]).map((m) => (
                <Button key={m} variant={settings.routingMode === m ? "primary" : "quiet"} onClick={() => setRouting(m)}>{m}</Button>
              ))}
            </div>
          </Panel>
        </section>
        <section>
          <Kicker>Live connector</Kicker>
          <Panel className="mt-2 px-4 py-4">
            <Button variant="quiet" className="w-full" onClick={() => { const r = liveConnectorStub(); setLiveMsg(`${r.code}: ${r.message}`); }}>Try live read-only connector</Button>
            {liveMsg && <p className="mt-2 text-xs text-warn">{liveMsg}</p>}
          </Panel>
        </section>
        <section>
          <Kicker>Danger</Kicker>
          <div className="mt-2 grid gap-2">
            <Button variant="quiet" onClick={() => setNotice(tryDelete() ? "deleted" : "Delete refused — append-only.")}>Delete audit log</Button>
            <Button variant="quiet" onClick={() => { resetDemo(); setNotice("Demo reset."); }}>Reset demo</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
