import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const STATUS_STYLES = {
  New: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  Assigned: { pill: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  "In Progress": { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  Done: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.New;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${style.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

export default function RecentWorkOrders({ workOrders }) {
  const navigate = useNavigate();
  const recent = [...workOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="bg-white border border-border rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-150">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-ink">Recent Work Orders</h2>
        <Link
          to="/work-orders"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="px-6 py-8 text-sm text-ink-muted">No work orders yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {recent.map((wo) => (
            <li
              key={wo.id}
              onClick={() => navigate(`/work-orders/${wo.id}`)}
              className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-[#FFF7ED] transition-colors duration-150 cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {wo.title || <span className="italic text-slate-400 font-normal">Untitled</span>}
                </p>
                <p className="text-xs text-ink-muted mt-0.5 truncate">{wo.customer?.name}</p>
              </div>
              <StatusPill status={wo.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
