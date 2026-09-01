import { NavLink } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  ListTree,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { useAuth } from "../../features/auth/auth.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/work-orders", label: "Work Orders", icon: ListChecks },
  { to: "/technicians", label: "Technicians", icon: Users },
  { to: "/customers", label: "Customers", icon: Building2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV_ITEMS = [
  { to: "/admin/issues", label: "Issues", icon: Ticket },
  { to: "/admin/ticket-optimization", label: "Ticket Optimization", icon: ListTree },
];

function navLinkClass({ isActive }) {
  return [
    "flex items-center gap-3 px-3 py-2 rounded-control text-sm font-medium transition-colors",
    isActive ? "bg-orange-100 text-orange-600" : "text-gray-600 hover:bg-[#FFF7ED] hover:text-ink",
  ].join(" ");
}

export default function Sidebar() {
  const { user } = useAuth();
  const isAdministrator = user?.role === "Administrator";

  return (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-border flex flex-col">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="h-8 w-8 rounded-control bg-primary flex items-center justify-center">
          <ClipboardList className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
        </div>
        <span className="text-ink font-semibold text-[15px] tracking-tight">WorkFlow</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {label}
          </NavLink>
        ))}

        {isAdministrator && (
          <>
            <p className="px-3 pt-4 pb-1 text-xs font-semibold text-ink-muted uppercase tracking-wide">
              Admin
            </p>
            {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="px-5 py-4 border-t border-border text-xs text-ink-muted">
        WorkFlow demo build
      </div>
    </aside>
  );
}
