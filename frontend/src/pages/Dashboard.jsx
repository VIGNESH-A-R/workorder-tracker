import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import StatCards from "../components/StatCards.jsx";
import WorkOrderTable from "../components/WorkOrderTable.jsx";
import WorkOrderModal from "../components/WorkOrderModal.jsx";
import { getStats, getWorkOrders } from "../api.js";

export default function Dashboard() {
  const [workOrders, setWorkOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [workOrdersData, statsData] = await Promise.all([getWorkOrders(), getStats()]);
      setWorkOrders(workOrdersData);
      setStats(statsData);
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
    <AppShell title="Dashboard">
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
          Failed to load data: {error}
        </p>
      )}

      <StatCards stats={stats} />

      <div className="bg-white border border-border rounded-card shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-ink">All Work Orders</h2>
            <p className="text-xs text-ink-muted mt-0.5">{workOrders.length} total</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3.5 py-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Work Order
          </button>
        </div>

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
