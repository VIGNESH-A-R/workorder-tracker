import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { ListTree, LogOut, Menu, Settings, Ticket } from "lucide-react";
import { useAuth } from "../../features/auth/auth.jsx";

const NAV_ITEMS = [
  { to: "/issues", label: "Tickets", icon: Ticket },
  { to: "/ticket-optimization", label: "Ticket Triage", icon: ListTree },
  { to: "/settings", label: "Settings", icon: Settings },
];

const COLLAPSED_STORAGE_KEY = "workorder_tracker_sidebar_collapsed";

function navLinkClass(collapsed) {
  return ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-control text-sm font-medium transition-colors",
      collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
      isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-slate-100 hover:text-ink",
    ].join(" ");
}

// Static branding + logout, pinned to the bottom of the sidebar — no longer
// tied to the logged-in user's name/role (that moved out of the top bar
// entirely; Settings' Profile section is still where the real user identity
// lives). Click opens a small popover above the block, same "click target
// with a Log out option" shape the old Topbar menu used, just repositioned.
function SidebarFooter({ collapsed }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative group border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`w-full flex items-center gap-2.5 hover:bg-slate-100 transition-colors cursor-pointer ${
          collapsed ? "justify-center px-0 py-3" : "px-4 py-3"
        }`}
      >
        <div className="h-7 w-7 rounded-control bg-primary flex items-center justify-center shrink-0">
          <Ticket className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
        </div>
        {!collapsed && <span className="text-sm font-semibold text-ink truncate">United Techno</span>}
      </button>

      {collapsed && !open && (
        <span className="pointer-events-none absolute left-full bottom-3 ml-2 whitespace-nowrap rounded-md bg-ink text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-40">
          United Techno
        </span>
      )}

      {open && (
        <div
          className={`absolute bottom-full mb-1 bg-white border border-border rounded-card shadow-card py-1 z-30 ${
            collapsed ? "left-full ml-2 w-36" : "left-2 right-2"
          }`}
        >
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
    } catch {
      // Storage can be unavailable (e.g. private browsing) — collapsing
      // still works for the session, it just won't persist.
    }
  }, [collapsed]);

  return (
    <aside
      className={`shrink-0 bg-sidebar border-r border-border flex flex-col transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-16" : "w-[248px]"
      }`}
    >
      <div className={`flex items-center h-16 border-b border-border ${collapsed ? "justify-center px-0" : "gap-2 px-4"}`}>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-control text-ink-muted hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>

        {!collapsed && (
          <>
            <div className="h-8 w-8 rounded-control bg-primary flex items-center justify-center shrink-0">
              <Ticket className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
            </div>
            <span className="text-ink font-semibold text-[15px] tracking-tight truncate">Ticketing System</span>
          </>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <div key={to} className="relative group">
            <NavLink to={to} className={navLinkClass(collapsed)}>
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {!collapsed && label}
            </NavLink>
            {collapsed && (
              <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md bg-ink text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-40">
                {label}
              </span>
            )}
          </div>
        ))}
      </nav>

      <SidebarFooter collapsed={collapsed} />
    </aside>
  );
}
