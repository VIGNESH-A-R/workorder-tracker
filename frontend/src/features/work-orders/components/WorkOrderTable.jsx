import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, SearchX } from "lucide-react";
import toast from "react-hot-toast";
import { updateWorkOrder } from "../api.js";
import { getCustomers } from "../../customers/api.js";
import { useTableControls } from "../../../shared/hooks/useTableControls.js";
import SearchInput from "../../../shared/components/SearchInput.jsx";
import SearchableSelect from "../../../shared/components/SearchableSelect.jsx";
import SortableHeader from "../../../shared/components/SortableHeader.jsx";
import Pagination from "../../../shared/components/Pagination.jsx";

const STATUSES = ["New", "Assigned", "In Progress", "Done"];

const STATUS_STYLES = {
  New: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  Assigned: { pill: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  "In Progress": { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  Done: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.New;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
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

const SEARCH_FIELDS = [(wo) => wo.title, (wo) => wo.customer?.name, (wo) => wo.location];

const SORT_ACCESSORS = {
  title: (wo) => wo.title,
  customer: (wo) => wo.customer?.name,
  status: (wo) => wo.status,
  scheduledDate: (wo) => (wo.scheduledDate ? new Date(wo.scheduledDate).getTime() : null),
};

export default function WorkOrderTable({ workOrders, onUpdated }) {
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerFilter, setCustomerFilter] = useState("");

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, []);

  const { query, setQuery, debouncedQuery, items, page, totalPages, setPage, toggleSort, sortStateFor } =
    useTableControls({
      data: workOrders,
      searchFields: SEARCH_FIELDS,
      sortAccessors: SORT_ACCESSORS,
      filterValue: customerFilter,
      filterFn: (wo, custId) => String(wo.customerId) === custId,
    });

  const handleStatusChange = useCallback(
    async (id, status) => {
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
    },
    [onUpdated]
  );

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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 pt-4">
        <div className="w-full sm:w-56">
          <SearchableSelect
            ariaLabel="Filter by customer"
            value={customerFilter}
            onChange={setCustomerFilter}
            placeholder="All Customers"
            options={[
              { value: "", label: "All Customers" },
              ...customers.map((customer) => ({ value: String(customer.id), label: customer.name })),
            ]}
          />
        </div>

        <SearchInput value={query} onChange={setQuery} placeholder="Search work orders..." />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <SearchX className="h-5 w-5 text-ink-muted" />
          </div>
          <p className="text-sm font-medium text-ink">
            {debouncedQuery ? <>No results for &ldquo;{debouncedQuery}&rdquo;</> : "No work orders match this filter"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <SortableHeader label="Title" sortKey="title" sortState={sortStateFor("title")} onSort={toggleSort} />
                <SortableHeader
                  label="Customer"
                  sortKey="customer"
                  sortState={sortStateFor("customer")}
                  onSort={toggleSort}
                />
                <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
                  Technician
                </th>
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  sortState={sortStateFor("status")}
                  onSort={toggleSort}
                />
                <SortableHeader
                  label="Scheduled Date"
                  sortKey="scheduledDate"
                  sortState={sortStateFor("scheduledDate")}
                  onSort={toggleSort}
                />
              </tr>
            </thead>
            <tbody>
              {items.map((wo) => (
                <tr
                  key={wo.id}
                  onClick={() => navigate(`/work-orders/${wo.id}`)}
                  className="border-b border-border last:border-0 hover:bg-[#FFF7ED] transition-colors duration-150 cursor-pointer"
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
                        className="text-xs border border-border rounded-control px-2 py-1 bg-white text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 cursor-pointer"
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
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
