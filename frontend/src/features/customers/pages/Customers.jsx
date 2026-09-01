import { Fragment, useEffect, useState } from "react";
import { Building2, ChevronDown, ChevronRight, SearchX } from "lucide-react";
import AppShell from "../../../shared/components/AppShell.jsx";
import SearchInput from "../../../shared/components/SearchInput.jsx";
import SortableHeader from "../../../shared/components/SortableHeader.jsx";
import Pagination from "../../../shared/components/Pagination.jsx";
import { useTableControls } from "../../../shared/hooks/useTableControls.js";
import { getCustomer, getCustomers } from "../api.js";

const STATUS_STYLES = {
  New: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  Assigned: { pill: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  "In Progress": { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  Done: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.New;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

function CustomerWorkOrders({ customerId }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomer(customerId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return <p className="px-4 py-4 text-sm text-ink-muted">Loading work orders...</p>;
  }

  if (!detail || detail.workOrders.length === 0) {
    return <p className="px-4 py-4 text-sm text-ink-muted">No work orders for this customer yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {detail.workOrders.map((wo) => (
        <li key={wo.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
          <span className="text-ink">{wo.title || <span className="italic text-slate-400">Untitled</span>}</span>
          <div className="flex items-center gap-3 text-ink-muted">
            <span>{wo.technician ? wo.technician.name : "Unassigned"}</span>
            <StatusPill status={wo.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const SEARCH_FIELDS = [(customer) => customer.name, (customer) => customer.contactEmail];

const SORT_ACCESSORS = {
  name: (customer) => customer.name,
  workOrderCount: (customer) => customer.workOrderCount,
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const { query, setQuery, debouncedQuery, items, page, totalPages, setPage, toggleSort, sortStateFor } =
    useTableControls({ data: customers, searchFields: SEARCH_FIELDS, sortAccessors: SORT_ACCESSORS });

  function toggleExpanded(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <AppShell title="Customers">
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
          Failed to load customers: {error}
        </p>
      )}

      <div className="bg-white border border-border rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-150">
        {loading ? (
          <p className="px-6 py-8 text-sm text-ink-muted">Loading...</p>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-5 w-5 text-ink-muted" />
            </div>
            <p className="text-sm font-medium text-ink">No customers yet</p>
          </div>
        ) : (
          <>
            <div className="px-4 pt-4">
              <SearchInput value={query} onChange={setQuery} placeholder="Search customers..." />
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <SearchX className="h-5 w-5 text-ink-muted" />
                </div>
                <p className="text-sm font-medium text-ink">No results for &ldquo;{debouncedQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-8" />
                      <SortableHeader
                        label="Name"
                        sortKey="name"
                        sortState={sortStateFor("name")}
                        onSort={toggleSort}
                      />
                      <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
                        Contact
                      </th>
                      <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
                        Address
                      </th>
                      <SortableHeader
                        label="Work Orders"
                        sortKey="workOrderCount"
                        sortState={sortStateFor("workOrderCount")}
                        onSort={toggleSort}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((customer) => (
                      <Fragment key={customer.id}>
                        <tr
                          onClick={() => toggleExpanded(customer.id)}
                          className="border-b border-border last:border-0 hover:bg-[#FFF7ED] transition-colors duration-150 cursor-pointer"
                        >
                          <td className="pl-4 py-3.5 text-ink-muted">
                            {expandedId === customer.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-ink">{customer.name}</td>
                          <td className="px-4 py-3.5 text-ink-muted">
                            {customer.contactEmail || customer.phone || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-ink-muted">{customer.address || "—"}</td>
                          <td className="px-4 py-3.5 text-ink">{customer.workOrderCount}</td>
                        </tr>
                        {expandedId === customer.id && (
                          <tr className="border-b border-border last:border-0 bg-slate-50/60">
                            <td colSpan={5}>
                              <CustomerWorkOrders customerId={customer.id} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </AppShell>
  );
}
