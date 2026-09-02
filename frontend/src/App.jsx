import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./features/auth/pages/Login.jsx";
import Settings from "./features/settings/pages/Settings.jsx";
import IssueWorkspace from "./features/issues/pages/IssueWorkspace.jsx";
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/issues" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues"
        element={
          <ProtectedRoute>
            <IssueWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues/:key"
        element={
          <ProtectedRoute>
            <IssueWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket-optimization"
        element={
          <ProtectedRoute>
            <TicketOptimization />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
