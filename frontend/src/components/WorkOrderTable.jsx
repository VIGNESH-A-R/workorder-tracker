import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { updateWorkOrder } from "../api.js";

const STATUSES = ["New", "Assigned", "In Progress", "Done"];

const STATUS_STYLES = {
  New: "bg-slate-100 text-slate-600",
  Assigned: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Done: "bg-emerald-50 text-emerald-700",
};

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.New;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkOrderTable({ workOrders, onUpdated }) {
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    try {
      await updateWorkOrder(id, { status });
      await onUpdated();
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (workOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Inbox className="h-5 w-5 text-ink-muted" />
        </div>
        <p className="text-sm font-medium text-ink">No work orders yet</p>
        <p className="text-sm text-ink-muted mt-1">
          Create your first work order to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
              Title
            </th>
            <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
              Customer
            </th>
            <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
              Technician
            </th>
            <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
              Status
            </th>
            <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
              Scheduled Date
            </th>
          </tr>
        </thead>
        <tbody>
          {workOrders.map((wo) => (
            <tr
              key={wo.id}
              onClick={() => navigate(`/work-orders/${wo.id}`)}
              className="border-b border-border last:border-0 hover:bg-slate-50/80 transition-colors cursor-pointer"
            >
              <td className="px-4 py-3.5 font-medium text-ink">
                {wo.title || <span className="text-slate-400 italic font-normal">Untitled</span>}
              </td>
              <td className="px-4 py-3.5 text-ink">{wo.customer?.name}</td>
              <td className="px-4 py-3.5">
                {wo.technician ? (
                  <span className="text-ink">{wo.technician.name}</span>
                ) : (
                  <span className="text-slate-400 italic">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <StatusPill status={wo.status} />
                  <select
                    aria-label={`Change status for ${wo.title}`}
                    value={wo.status}
                    disabled={updatingId === wo.id}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(wo.id, e.target.value)}
                    className="text-xs border border-border rounded-control px-2 py-1 bg-white text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <td className="px-4 py-3.5 text-ink-muted">{formatDate(wo.scheduledDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
