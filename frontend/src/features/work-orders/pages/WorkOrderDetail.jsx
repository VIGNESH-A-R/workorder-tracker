import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Building2, Calendar, Clock, User } from "lucide-react";
import toast from "react-hot-toast";
import AppShell from "../../../shared/components/AppShell.jsx";
import { getWorkOrder, updateWorkOrder } from "../api.js";

const STATUSES = ["New", "Assigned", "In Progress", "Done"];

const STATUS_STYLES = {
  New: "bg-slate-100 text-slate-600",
  Assigned: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Done: "bg-emerald-50 text-emerald-700",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function WorkOrderDetail() {
  const { id } = useParams();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getWorkOrder(id);
      setWorkOrder(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleStatusChange(status) {
    setUpdating(true);
    try {
      await updateWorkOrder(id, { status });
      await refresh();
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  const pageTitle = workOrder ? workOrder.title || `Work Order #${id}` : `Work Order #${id}`;

  return (
    <AppShell title={pageTitle} backTo="/" backLabel="Back to dashboard">
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
          Failed to load work order: {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading...</p>
      ) : workOrder ? (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-card shadow-card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <p className="text-sm text-ink-muted">
                {workOrder.description || "No description provided."}
              </p>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    STATUS_STYLES[workOrder.status] || STATUS_STYLES.New
                  }`}
                >
                  {workOrder.status}
                </span>
                <select
                  value={workOrder.status}
                  disabled={updating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-sm border border-border rounded-control px-2.5 py-1.5 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
              <div className="flex items-start gap-2 text-sm">
                <Calendar className="h-4 w-4 text-ink-muted mt-0.5" />
                <div>
                  <p className="text-ink-muted text-xs">Scheduled Date</p>
                  <p className="text-ink">{formatDate(workOrder.scheduledDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-ink-muted mt-0.5" />
                <div>
                  <p className="text-ink-muted text-xs">Created</p>
                  <p className="text-ink">{formatDateTime(workOrder.createdAt)}</p>
                </div>
              </div>
              {workOrder.location && (
                <div className="sm:col-span-2 text-sm">
                  <p className="text-ink-muted text-xs">Location</p>
                  <p className="text-ink">{workOrder.location}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-card shadow-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-ink-muted" />
                <h2 className="text-sm font-semibold text-ink">Customer</h2>
              </div>
              {workOrder.customer ? (
                <div className="text-sm space-y-1">
                  <p className="text-ink font-medium">{workOrder.customer.name}</p>
                  {workOrder.customer.contactEmail && (
                    <p className="text-ink-muted">{workOrder.customer.contactEmail}</p>
                  )}
                  {workOrder.customer.phone && <p className="text-ink-muted">{workOrder.customer.phone}</p>}
                  {workOrder.customer.address && <p className="text-ink-muted">{workOrder.customer.address}</p>}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">No customer on file.</p>
              )}
            </div>

            <div className="bg-white border border-border rounded-card shadow-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-ink-muted" />
                <h2 className="text-sm font-semibold text-ink">Technician</h2>
              </div>
              {workOrder.technician ? (
                <div className="text-sm space-y-1">
                  <p className="text-ink font-medium">{workOrder.technician.name}</p>
                  {workOrder.technician.specialty && (
                    <p className="text-ink-muted">{workOrder.technician.specialty}</p>
                  )}
                  {workOrder.technician.phone && <p className="text-ink-muted">{workOrder.technician.phone}</p>}
                </div>
              ) : (
                <p className="text-sm text-ink-muted italic">Unassigned</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-border rounded-card shadow-card p-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Activity</h2>
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
              <div className="relative flex items-start gap-3">
                <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-slate-200 border-2 border-white" />
                <p className="text-sm text-ink-muted">No activity yet.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
