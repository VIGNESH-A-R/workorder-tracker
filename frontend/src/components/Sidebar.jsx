import { NavLink } from "react-router-dom";
import { Building2, ClipboardList, LayoutDashboard, Settings, Users } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/technicians", label: "Technicians", icon: Users },
  { to: "/customers", label: "Customers", icon: Building2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-sidebar text-slate-200 flex flex-col">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <div className="h-8 w-8 rounded-control bg-primary flex items-center justify-center">
          <ClipboardList className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
        </div>
        <span className="text-white font-semibold text-[15px] tracking-tight">WorkFlow</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2 rounded-control text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
              ].join(" ")
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-xs text-slate-500">
        WorkFlow demo build
      </div>
    </aside>
  );
}
