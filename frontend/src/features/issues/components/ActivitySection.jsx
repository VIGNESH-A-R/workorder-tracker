import { AlertTriangle, MessageSquare, Sparkles } from "lucide-react";
import DOMPurify from "dompurify";
import DevActivityCard from "../../../shared/components/DevActivityCard.jsx";
import { formatRelative } from "../dateFormat.js";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function CommentRow({ comment }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
        {getInitials(comment.author)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{comment.author}</span>
          <span className="text-xs text-slate-400">{formatRelative(comment.created)}</span>
        </div>
        <p className="text-sm text-slate-600 whitespace-pre-wrap mt-0.5">{comment.body}</p>
      </div>
    </div>
  );
}

// Pure content, stacked below TicketDetailPanel inside TicketPanel.jsx's one
// scrollable column: AI Analysis (endpoint reused unchanged), read-only
// DevActivityCard for GitHub issues (unchanged), then a read-only comments
// feed — no composer, posting isn't supported here.
export default function ActivitySection({ issue, source, aiLoading, aiHtml, aiError, onRunAiAnalysis, comments }) {
  return (
    <div className="space-y-5">
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">AI Analysis</h2>
          </div>
          <button
            type="button"
            onClick={onRunAiAnalysis}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium px-2.5 py-1.5 transition-colors disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Run AI Analysis
          </button>
        </div>

        {aiLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
          </div>
        ) : aiError ? (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {aiError}
          </p>
        ) : aiHtml ? (
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(aiHtml) }} />
        ) : (
          <p className="text-xs text-slate-400">Not run yet for this ticket.</p>
        )}
      </div>

      {source === "github" && <DevActivityCard identifier={issue.key.replace(/^#/, "")} />}

      <div className="bg-white border border-border rounded-card shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h2>
        </div>

        {comments.length === 0 ? (
          <p className="text-xs text-slate-400">No comments yet.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <CommentRow key={index} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
