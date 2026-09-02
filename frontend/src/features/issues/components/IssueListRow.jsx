import { PriorityPill, StatusPill } from "./IssuePills.jsx";
import { formatRelative } from "../dateFormat.js";

// The key badge stays neutral (slate) rather than using the accent color, so
// it doesn't compete with the selected-state accent below. Each ticket is
// its own rounded, bordered card (not a flush divided list) so cards read
// as clearly separated blocks.
export default function IssueListRow({ issue, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={`w-full text-left rounded-lg border px-3.5 py-3 transition-colors cursor-pointer ${
        selected
          ? "border-primary/30 border-l-4 border-l-primary bg-primary/[0.05]"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 font-mono text-[10.5px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
            {issue.key}
          </span>
          <h3 className="text-sm font-semibold text-slate-900 truncate">
            {issue.summary || <span className="italic text-slate-400 font-normal">Untitled</span>}
          </h3>
        </div>
        <span className="shrink-0 text-[11px] text-slate-400">{formatRelative(issue.updated)}</span>
      </div>

      <div className="flex items-center gap-1.5 mt-1.5">
        <StatusPill status={issue.status} />
        <PriorityPill priority={issue.priority} />
      </div>

      {issue.description && <p className="mt-1.5 text-xs text-slate-500 truncate">{issue.description}</p>}
    </button>
  );
}
