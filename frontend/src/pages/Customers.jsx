import { Fragment, useEffect, useState } from "react";
import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { getCustomer, getCustomers } from "../api.js";

const STATUS_STYLES = {
  New: "bg-slate-100 text-slate-600",
  Assigned: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Done: "bg-emerald-50 text-emerald-700",
};

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.New}`}>
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

      <div className="bg-white border border-border rounded-card shadow-card">
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-8" />
                <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">Name</th>
                <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">Contact</th>
                <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">Address</th>
                <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">Work Orders</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <Fragment key={customer.id}>
                  <tr
                    onClick={() => toggleExpanded(customer.id)}
                    className="border-b border-border last:border-0 hover:bg-slate-50/80 transition-colors cursor-pointer"
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
        )}
      </div>
    </AppShell>
  );
}
