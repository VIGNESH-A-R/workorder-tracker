import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export default function SortableHeader({ label, sortKey, sortState, onSort, className = "" }) {
  const Icon = sortState === "asc" ? ChevronUp : sortState === "desc" ? ChevronDown : ChevronsUpDown;

  return (
    <th className={`text-left px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 font-medium text-ink-muted uppercase tracking-wide text-xs hover:text-ink transition-colors cursor-pointer"
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${sortState ? "text-primary" : "text-ink-muted"}`} />
      </button>
    </th>
  );
}
