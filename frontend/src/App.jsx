import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./features/auth/pages/Login.jsx";
import Dashboard from "./features/dashboard/pages/Dashboard.jsx";
import WorkOrders from "./features/work-orders/pages/WorkOrders.jsx";
import WorkOrderDetail from "./features/work-orders/pages/WorkOrderDetail.jsx";
import Technicians from "./features/technicians/pages/Technicians.jsx";
import Customers from "./features/customers/pages/Customers.jsx";
import Settings from "./features/settings/pages/Settings.jsx";
import Issues from "./features/jira/pages/Issues.jsx";
import JiraIssueDetail from "./features/jira/pages/JiraIssueDetail.jsx";
import TicketOptimization from "./features/ticket-optimization/pages/TicketOptimization.jsx";
import { useAuth } from "./features/auth/auth.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted text-sm">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted text-sm">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "Administrator") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders"
        element={
          <ProtectedRoute>
            <WorkOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders/:id"
        element={
          <ProtectedRoute>
            <WorkOrderDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technicians"
        element={
          <ProtectedRoute>
            <Technicians />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/issues"
        element={
          <AdminRoute>
            <Issues />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/issues/:key"
        element={
          <AdminRoute>
            <JiraIssueDetail />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/ticket-optimization"
        element={
          <AdminRoute>
            <TicketOptimization />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
