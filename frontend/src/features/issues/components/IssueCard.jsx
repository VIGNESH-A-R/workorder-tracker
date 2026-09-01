import { useNavigate } from "react-router-dom";
import { AlertTriangle, Calendar, Folder, Target } from "lucide-react";
import { KeyPill, PriorityPill, StatusPill, isHighPriorityNotStarted } from "./IssuePills.jsx";
import { formatShortDate } from "../dateFormat.js";
import { issueDetailPath } from "../issueRoute.js";

export default function IssueCard({ issue }) {
  const navigate = useNavigate();
  // priority is always null for GitHub issues, so this (and the pill below)
  // naturally never fires/renders for them — no provider branching needed.
  const flagged = isHighPriorityNotStarted(issue);
  const startDate = formatShortDate(issue.startDate);
  const dueDate = formatShortDate(issue.dueDate);

  return (
    <div
      onClick={() => navigate(issueDetailPath(issue.key))}
      className="bg-white border border-border rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-150 p-5 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <KeyPill issueKey={issue.key} />
          <h3 className="font-semibold text-ink">
            {issue.summary || <span className="italic text-slate-400 font-normal">Untitled</span>}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PriorityPill priority={issue.priority} />
          <StatusPill status={issue.status} />
        </div>
      </div>

      {(issue.project || startDate || dueDate) && (
        <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted flex-wrap">
          {issue.project && (
            <span className="inline-flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5" />
              {issue.project}
            </span>
          )}
          {startDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Start: {startDate}
            </span>
          )}
          {dueDate && (
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Due: {dueDate}
            </span>
          )}
        </div>
      )}

      {issue.description && (
        <p className="mt-3 text-sm text-ink-muted line-clamp-2">{issue.description}</p>
      )}

      {flagged && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-control bg-amber-50 text-amber-700 px-3 py-2 text-xs font-medium">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          High priority — not started
        </div>
      )}
    </div>
  );
}
