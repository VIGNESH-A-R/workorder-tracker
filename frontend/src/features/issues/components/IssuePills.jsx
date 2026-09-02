// Status colors match the existing STATUS_OPTIONS list used for filtering
// (Issues.jsx). Priority is a graduated red -> amber -> green scale reusing
// hues already in the app's palette (red is new here since no existing
// status pill needed it) rather than copying an external reference literally.
const STATUS_STYLES = {
  "To Do": "bg-slate-100 text-slate-600",
  "In Progress": "bg-amber-50 text-amber-700",
  Done: "bg-emerald-50 text-emerald-700",
  Open: "bg-amber-50 text-amber-700",
  Closed: "bg-emerald-50 text-emerald-700",
};

const PRIORITY_STYLES = {
  Highest: "bg-red-100 text-red-700",
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
  Lowest: "bg-emerald-50 text-emerald-700",
};

export function StatusPill({ status }) {
  if (!status) return null;
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
      {status}
    </span>
  );
}

export function PriorityPill({ priority }) {
  if (!priority) return null;
  const style = PRIORITY_STYLES[priority] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
      {priority}
    </span>
  );
}

