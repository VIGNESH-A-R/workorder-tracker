import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

// Shared page heading pattern: every page passes its title (and, for detail
// pages, a backTo route) instead of repeating heading markup six times over.
export default function AppShell({ title, backTo, backLabel = "Back", children }) {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {backTo && (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-ink mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
