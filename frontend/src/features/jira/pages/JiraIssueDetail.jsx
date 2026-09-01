import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  Folder,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
  User,
  UserCheck,
} from "lucide-react";
import DOMPurify from "dompurify";
import AppShell from "../../../shared/components/AppShell.jsx";
import { KeyPill, PriorityPill, StatusPill } from "../components/IssuePills.jsx";
import { getIssueAIAnalysis, getIssueDetail } from "../api.js";
import { formatRelative, formatShortDate } from "../dateFormat.js";

export default function JiraIssueDetail() {
  const { key } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHtml, setAiHtml] = useState(null);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getIssueDetail(key)
      .then((data) => {
        if (!cancelled) setIssue(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load this ticket.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  async function handleRunAiAnalysis() {
    setAiLoading(true);
    setAiError(null);
    try {
      const { html } = await getIssueAIAnalysis(key, issue);
      setAiHtml(html);
    } catch (err) {
      setAiError(err.message || "AI analysis is temporarily unavailable.");
    } finally {
      setAiLoading(false);
    }
  }

  const pageTitle = issue ? (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5 flex-wrap">
        <KeyPill issueKey={issue.key} />
        <span>{issue.summary || <span className="italic text-slate-400 font-normal">Untitled</span>}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <PriorityPill priority={issue.priority} />
        <StatusPill status={issue.status} />
        <button
          type="button"
          onClick={handleRunAiAnalysis}
          disabled={aiLoading}
          className="inline-flex items-center gap-1.5 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3 py-1.5 transition-colors disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          Run AI Analysis
        </button>
      </div>
    </div>
  ) : (
    key
  );

  return (
    <AppShell title={pageTitle} backTo="/admin/issues" backLabel="Back to issues">
      {error ? (
        <div className="bg-white border border-border rounded-card shadow-card py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm font-medium text-ink">Couldn&rsquo;t load this ticket</p>
          <p className="text-sm text-ink-muted mt-1">{error}</p>
        </div>
      ) : loading ? (
        <div className="bg-white border border-border rounded-card shadow-card flex flex-col items-center justify-center py-16">
          <Loader2 className="h-5 w-5 text-ink-muted animate-spin mb-2" />
          <p className="text-sm text-ink-muted">Loading ticket from Jira...</p>
        </div>
      ) : issue ? (
        <div className="space-y-4">
          {(aiLoading || aiHtml || aiError) && (
            <div className="bg-white border border-border rounded-card shadow-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-ink-muted" />
                <h2 className="text-sm font-semibold text-ink">AI Analysis</h2>
              </div>

              {aiLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3.5 w-3/4 rounded bg-slate-100" />
                  <div className="h-3.5 w-1/2 rounded bg-slate-100" />
                  <div className="h-3.5 w-5/6 rounded bg-slate-100" />
                </div>
              ) : aiError ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {aiError}
                  </p>
                  <button
                    type="button"
                    onClick={handleRunAiAnalysis}
                    className="text-sm font-medium text-primary hover:text-primary-hover cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(aiHtml) }} />
              )}
            </div>
          )}

          <div className="bg-white border border-border rounded-card shadow-card p-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2 text-sm">
                <Folder className="h-4 w-4 text-ink-muted mt-0.5" />
                <div>
                  <p className="text-ink-muted text-xs">Project</p>
                  <p className="text-ink">{issue.project || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <User className="h-4 w-4 text-ink-muted mt-0.5" />
                <div>
                  <p className="text-ink-muted text-xs">Assignee</p>
                  <p className="text-ink">
                    {issue.assignee || <span className="italic text-slate-400">Unassigned</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-ink-muted mt-0.5" />
                <div>
                  <p className="text-ink-muted text-xs">Reporter</p>
                  <p className="text-ink">{issue.reporter || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Target className="h-4 w-4 text-ink-muted mt-0.5" />
                <div>
                  <p className="text-ink-muted text-xs">Due Date</p>
                  <p className="text-ink">{formatShortDate(issue.dueDate) || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-ink-muted mt-0.5" />
                <div>
                  <p className="text-ink-muted text-xs">Created</p>
                  <p className="text-ink">{formatShortDate(issue.created) || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-ink-muted mt-0.5" />
                <div>
                  <p className="text-ink-muted text-xs">Updated</p>
                  <p className="text-ink">{formatShortDate(issue.updated) || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-card shadow-card p-5">
            <h2 className="text-sm font-semibold text-ink mb-3">Description</h2>
            {issue.description ? (
              <p className="text-sm text-ink whitespace-pre-wrap">{issue.description}</p>
            ) : (
              <p className="text-sm text-ink-muted">No description provided.</p>
            )}
          </div>

          <div className="bg-white border border-border rounded-card shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-ink-muted" />
              <h2 className="text-sm font-semibold text-ink">
                Comments {issue.comments.length > 0 && `(${issue.comments.length})`}
              </h2>
            </div>

            {issue.comments.length === 0 ? (
              <p className="text-sm text-ink-muted">No comments yet.</p>
            ) : (
              <ul className="space-y-4">
                {issue.comments.map((comment, index) => (
                  <li key={index} className="pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-ink">{comment.author}</span>
                      <span className="text-xs text-ink-muted">{formatRelative(comment.created)}</span>
                    </div>
                    <p className="text-sm text-ink-muted whitespace-pre-wrap">{comment.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
