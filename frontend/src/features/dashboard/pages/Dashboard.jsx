import { useCallback, useEffect, useState } from "react";
import AppShell from "../../../shared/components/AppShell.jsx";
import StatCards from "../components/StatCards.jsx";
import StatusChart from "../components/StatusChart.jsx";
import TechnicianChart from "../components/TechnicianChart.jsx";
import RecentWorkOrders from "../components/RecentWorkOrders.jsx";
import { getStats, getWorkOrders } from "../../work-orders/api.js";

export default function Dashboard() {
  const [workOrders, setWorkOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      {loading ? (
        <p className="text-sm text-ink-muted">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <StatusChart workOrders={workOrders} />
            <TechnicianChart workOrders={workOrders} />
          </div>

          <RecentWorkOrders workOrders={workOrders} />
        </>
      )}
    </AppShell>
  );
}
