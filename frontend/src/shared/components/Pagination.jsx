import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-control px-2.5 py-1.5 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <span className="text-xs text-ink-muted">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-control px-2.5 py-1.5 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
