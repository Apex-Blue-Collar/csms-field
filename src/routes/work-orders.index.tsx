import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Panel, Row, ScreenTitle } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { simplePdf, workOrderCsv, workOrderExportRows } from "@/lib/engines";
import { useAppStore } from "@/lib/store";
import { downloadBlob } from "@/lib/utils";

export const Route = createFileRoute("/work-orders/")({ component: WorkOrders });

function WorkOrders() {
  const nav = useNavigate();
  const buildingId = useAppStore((s) => s.currentBuildingId);
  const companyId = useAppStore((s) => s.people.find((p) => p.id === s.currentUserId)?.companyId);
  const format = useAppStore((s) => s.companies.find((c) => c.id === companyId)?.workOrderFormat ?? "csv");
  const wos = useAppStore((s) => s.workOrders).filter((w) => w.buildingId === buildingId);
  const create = useAppStore((s) => s.createWorkOrder);
  const mark = useAppStore((s) => s.markExported);
  const log = useAppStore((s) => s.log);

  const exportAll = () => {
    const rows = workOrderExportRows(wos);
    if (format === "json") downloadBlob("work-orders.json", "application/json", JSON.stringify(rows, null, 2));
    else if (format === "pdf") downloadBlob("work-orders.pdf", "application/pdf", simplePdf("CSMS Field work orders", rows.flatMap((r) => [`${r.id} · ${r.equipment}`, r.symptom, ""])));
    else downloadBlob("work-orders.csv", "text/csv", workOrderCsv(rows));
    for (const w of wos) mark(w.id);
    log({ kind: "export", summary: `Exported ${wos.length} work order(s) as ${format}`, payload: { format, count: String(wos.length) } });
  };

  return (
    <div>
      <ScreenTitle kicker="CMMS-ready" title="Work orders" />
      <div className="px-5 pb-8">
        <p className="mb-3 text-sm text-muted">Harbor exports CSV. Atlas exports JSON. PDF is always available on the order. No BMS write.</p>
        <Button className="mb-3 w-full" onClick={() => { const id = create(); nav({ to: "/work-orders/$id", params: { id } }); }}>
          New from current task
        </Button>
        {wos.length > 0 && (
          <Button variant="quiet" className="mb-3 w-full" onClick={exportAll}>
            Export all as {format.toUpperCase()}
          </Button>
        )}
        <Panel>
          {wos.length === 0 && <p className="px-4 py-6 text-sm text-muted">None yet. Create from a task or fault card.</p>}
          {wos.map((w) => (
            <Row key={w.id} title={w.equipmentName || w.symptom} meta={`${w.status} · ${w.createdAt.slice(0, 16)}`}
              onClick={() => nav({ to: "/work-orders/$id", params: { id: w.id } })} />
          ))}
        </Panel>
      </div>
    </div>
  );
}
