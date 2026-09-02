import { useNavigate } from "react-router-dom";
import { Calendar, CircleDot, Flag, Folder, User } from "lucide-react";
import { formatShortDate } from "../../issues/dateFormat.js";
import { issueDetailPath } from "../../issues/issueRoute.js";

export default function OptimizationTicketCard({ ticket, level }) {
  const navigate = useNavigate();
  const dueDate = formatShortDate(ticket.dueDate);

  return (
    <div
      onClick={() => navigate(issueDetailPath(ticket.key))}
      className={`bg-white border border-border ${level.borderClass} border-l-4 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-150 p-4 cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-xs font-semibold text-ink-muted">{ticket.key}</span>
          <h3 className="font-semibold text-ink text-sm truncate">
            {ticket.summary || <span className="italic text-slate-400 font-normal">Untitled</span>}
          </h3>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${level.badgeClass}`}
        >
          {level.key}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted flex-wrap">
        {ticket.project && (
          <span className="inline-flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5" />
            {ticket.project}
          </span>
        )}
        {ticket.priority && (
          <span className="inline-flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" />
            {ticket.priority}
          </span>
        )}
        {ticket.status && (
          <span className="inline-flex items-center gap-1.5">
            <CircleDot className="h-3.5 w-3.5" />
            {ticket.status}
          </span>
        )}
        {dueDate && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {dueDate}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          {ticket.assignee}
        </span>
      </div>

      {ticket.solution && (
        <div className="mt-3 rounded-control bg-blue-50 text-blue-700 px-3 py-2 text-xs">
          <strong>Solution:</strong> {ticket.solution}
        </div>
      )}
    </div>
  );
}
