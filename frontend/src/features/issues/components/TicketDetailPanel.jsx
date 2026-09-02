import { useState } from "react";
import { ChevronDown, GitFork, Kanban } from "lucide-react";
import { PriorityPill, StatusPill } from "./IssuePills.jsx";
import { formatShortDate } from "../dateFormat.js";

function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
      >
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-3 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function MetaField({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">{label}</p>
      <p className="text-sm text-slate-700 truncate">{children}</p>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 truncate">{children}</p>
    </div>
  );
}

// Pure content — no outer scroll/width/padding wrapper of its own. It's
// composed inside TicketPanel.jsx alongside ActivitySection, both stacked in
// ONE scrollable column (this workspace has two panels, not three).
export default function TicketDetailPanel({ issue, source }) {
  const unassigned = <span className="italic text-slate-400">Unassigned</span>;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-start gap-3 flex-wrap">
          <span className="font-mono text-xs text-slate-500 bg-slate-100 rounded px-2 py-1 mt-1">{issue.key}</span>
          <h1 className="text-xl font-bold text-slate-900 flex-1 min-w-0">
            {issue.summary || <span className="italic text-slate-400 font-normal">Untitled</span>}
          </h1>
          <StatusPill status={issue.status} />
          <PriorityPill priority={issue.priority} />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-5">
          <MetaField label="Assignee">{issue.assignee || "Unassigned"}</MetaField>
          <MetaField label="Reporter">{issue.reporter || "—"}</MetaField>
          <MetaField label="Created">{formatShortDate(issue.created) || "—"}</MetaField>
          <MetaField label="Updated">{formatShortDate(issue.updated) || "—"}</MetaField>
        </div>
      </div>

      <CollapsibleSection title="Details" defaultOpen>
        <div className="grid grid-cols-[240px_240px] gap-x-6 gap-y-4">
          <DetailRow label={source === "github" ? "Repo" : "Project"}>{issue.project || "—"}</DetailRow>
          <DetailRow label="Priority">
            {issue.priority ? <PriorityPill priority={issue.priority} /> : "—"}
          </DetailRow>
          <DetailRow label="Status">
            <StatusPill status={issue.status} />
          </DetailRow>
          <DetailRow label="Assignee">{issue.assignee || unassigned}</DetailRow>
          <DetailRow label="Reporter">{issue.reporter || "—"}</DetailRow>
          <DetailRow label="Created">{formatShortDate(issue.created) || "—"}</DetailRow>
          <DetailRow label="Updated">{formatShortDate(issue.updated) || "—"}</DetailRow>
          <DetailRow label="Due Date">{formatShortDate(issue.dueDate) || "—"}</DetailRow>
          <DetailRow label="Source">
            <span className="inline-flex items-center gap-1.5">
              {source === "github" ? (
                <GitFork className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <Kanban className="h-3.5 w-3.5 text-slate-400" />
              )}
              {source === "github" ? "GitHub" : "Jira"}
            </span>
          </DetailRow>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Description" defaultOpen>
        {issue.description ? (
          <div className="border border-slate-100 rounded-md bg-slate-50 px-3.5 py-3">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{issue.description}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No description provided.</p>
        )}
      </CollapsibleSection>
    </div>
  );
}
