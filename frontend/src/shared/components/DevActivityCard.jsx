import { useEffect, useState } from "react";
import { GitBranch, GitCommit, GitPullRequest, Loader2 } from "lucide-react";
import { getDevActivity } from "../../features/github/api.js";
import { formatRelative } from "../../features/issues/dateFormat.js";

const PR_STATUS_STYLES = {
  Open: "bg-emerald-50 text-emerald-700",
  Merged: "bg-purple-50 text-purple-700",
  Closed: "bg-slate-100 text-slate-600",
};

function prStatusLabel(pr) {
  if (pr.merged) return "Merged";
  return pr.state === "open" ? "Open" : "Closed";
}

// Small local copy rather than a shared util — same pattern already
// duplicated per-component elsewhere (Topbar, the comments feed) rather
// than promoted, since this is the kind of five-line helper CLAUDE.md says
// to keep local until it's clearly worth sharing.
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function CommitAuthorAvatar({ commit }) {
  if (commit.authorAvatarUrl) {
    return <img src={commit.authorAvatarUrl} alt="" className="h-4 w-4 rounded-full shrink-0" />;
  }
  return (
    <span className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-semibold shrink-0">
      {getInitials(commit.author)}
    </span>
  );
}

// Read-only summary of the branch/commits/PR already associated with a
// GitHub issue — nothing here triggers any action, it only links out to
// GitHub for the user to look at.
export default function DevActivityCard({ identifier }) {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDevActivity(identifier)
      .then((data) => {
        if (!cancelled) setActivity(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load development activity.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [identifier]);

  return (
    <div className="bg-white border border-border rounded-card shadow-card p-5">
      <h2 className="text-sm font-semibold text-ink mb-4">Development Activity</h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-5 w-5 text-ink-muted animate-spin mb-2" />
          <p className="text-sm text-ink-muted">Loading development activity...</p>
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
          {error}
        </p>
      ) : !activity?.branch ? (
        <p className="text-sm text-ink-muted">No development activity yet for this issue.</p>
      ) : (
        <div className="space-y-5">
          <a
            href={activity.branch.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-primary-hover transition-colors"
          >
            <GitBranch className="h-4 w-4 text-ink-muted" />
            {activity.branch.name}
          </a>

          {activity.commits.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Commits</p>
              <ul className="space-y-1">
                {activity.commits.map((commit) => (
                  <li key={commit.sha}>
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-sm rounded-control px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors"
                    >
                      <GitCommit className="h-4 w-4 text-ink-muted shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 shrink-0">
                            {commit.sha}
                          </span>
                          <span className="text-ink truncate min-w-0">{commit.message}</span>
                          <span className="text-xs text-ink-muted shrink-0 ml-auto">
                            {formatRelative(commit.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CommitAuthorAvatar commit={commit} />
                          <span className="text-xs text-ink-muted">by {commit.author}</span>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activity.pullRequests.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                Pull Requests
              </p>
              <ul className="space-y-2">
                {activity.pullRequests.map((pr) => {
                  const label = prStatusLabel(pr);
                  return (
                    <li key={pr.number}>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 bg-white border border-border rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-150 px-3.5 py-2.5"
                      >
                        <span className="flex items-center gap-2 text-sm text-ink min-w-0">
                          <GitPullRequest className="h-4 w-4 text-ink-muted shrink-0" />
                          <span className="truncate">
                            <span className="text-ink-muted">#{pr.number}</span> {pr.title}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${PR_STATUS_STYLES[label]}`}
                        >
                          {label}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
