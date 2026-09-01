import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AppShell from "../../../shared/components/AppShell.jsx";
import WorkOrderTable from "../components/WorkOrderTable.jsx";
import WorkOrderModal from "../components/WorkOrderModal.jsx";
import { getWorkOrders } from "../api.js";

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getWorkOrders();
      setWorkOrders(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AppShell title="Work Orders">
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
          Failed to load data: {error}
        </p>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-muted">{workOrders.length} total</p>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3.5 py-2 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Work Order
        </button>
      </div>

      <div className="bg-white border border-border rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-150">
        {loading ? (
          <p className="px-6 py-8 text-sm text-ink-muted">Loading...</p>
        ) : (
          <WorkOrderTable workOrders={workOrders} onUpdated={refresh} />
        )}
      </div>

      <WorkOrderModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={refresh} />
    </AppShell>
  );
}
