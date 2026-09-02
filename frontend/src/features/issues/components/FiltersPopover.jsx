import { useEffect, useRef, useState } from "react";
import { Filter } from "lucide-react";

// Generic "Filters" button + panel, used by the Issue Workspace's left panel
// to group the provider-specific filter controls (project/status/sprint/
// priority for Jira, state for GitHub) behind one control instead of a row
// of separate dropdowns — this is an overlay, not page content, so it keeps
// a shadow for elevation even though the rest of the app uses hairline
// borders instead.
export default function FiltersPopover({ activeCount = 0, children }) {
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
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
          open || activeCount > 0
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        <Filter className="h-3.5 w-3.5" />
        Filters
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-white text-[10px] font-semibold">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
