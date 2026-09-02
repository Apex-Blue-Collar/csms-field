import { FieldCommand } from "@/components/field-command";
import { useAppStore } from "@/lib/store";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bot, LayoutGrid, ListTodo, MoreHorizontal, Radio } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Today", icon: Radio },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/assets", label: "Assets", icon: LayoutGrid },
  { to: "/copilot", label: "Copilot", icon: Bot },
  { to: "/more", label: "More", icon: MoreHorizontal },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const people = useAppStore((s) => s.people);
  const userId = useAppStore((s) => s.currentUserId);
  const buildings = useAppStore((s) => s.buildings);
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const settings = useAppStore((s) => s.settings);
  const queue = useAppStore((s) => s.queue);
  const user = people.find((p) => p.id === userId);
  const building = buildings.find((b) => b.id === buildingId);
  const pending = queue.filter((q) => !q.synced).length;

  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <aside className="hidden w-64 flex-col justify-between px-6 py-10 lg:flex">
        <div>
          <p className="label-kicker">CSMS Field</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">Smart Maintenance. Predictive Performance.</p>
          <p className="mt-4 text-xs leading-relaxed text-faint">Read-only. PM-first. Existing controllers keep the building.</p>
        </div>
        <p className="text-xs text-faint">Churchill CSMS™</p>
      </aside>
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col shadow-[var(--shadow-border)]">
        <header className="flex shrink-0 items-center justify-between px-5 pt-3 pb-1">
          <div>
            <p className="label-kicker">CSMS Field</p>
            <p className="text-xs text-muted">{building?.name} · {user?.name.split(" ")[0]}</p>
          </div>
          <span className="text-xs text-muted">
            {settings.airplaneMode ? "OFFLINE" : settings.routingMode.toUpperCase()}
            {pending ? ` · ${pending} queued` : ""}
          </span>
        </header>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-y-auto pb-4">{children}</main>
          <FieldCommand />
        </div>
        <nav className="grid shrink-0 grid-cols-5 border-t border-border pb-[env(safe-area-inset-bottom)]">
          {NAV.map((n) => {
            const on = n.to === "/" ? path === "/" : path.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] tracking-widest uppercase ${on ? "text-foreground" : "text-faint"}`}>
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
