import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "../auth.jsx";

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 shrink-0 bg-white border-b border-border flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2.5 rounded-control px-2 py-1.5 hover:bg-slate-100 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-indigo-100 text-primary flex items-center justify-center">
            <User className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <div className="text-sm font-medium text-ink">{user?.fullName}</div>
            <div className="text-xs text-ink-muted">{user?.role}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-ink-muted" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-card shadow-card py-1 z-20">
            <div className="px-3 py-2 border-b border-border sm:hidden">
              <div className="text-sm font-medium text-ink">{user?.fullName}</div>
              <div className="text-xs text-ink-muted">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-slate-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
