import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, PlugZap, SearchX } from "lucide-react";
import AppShell from "../../../shared/components/AppShell.jsx";
import SearchInput from "../../../shared/components/SearchInput.jsx";
import SearchableSelect from "../../../shared/components/SearchableSelect.jsx";
import IssueCard from "../components/IssueCard.jsx";
import { getJiraIssues, getJiraProjects, getSprints } from "../api.js";

// Fixed list for now — the backend forwards whatever is picked straight into
// a JQL `status = "..."` clause; Jira's actual status set varies per project.
const STATUS_OPTIONS = ["To Do", "In Progress", "Done"];

// Standard Jira priority set. Filtered client-side against the currently
// loaded page of results — Jira's search/jql endpoint doesn't take a
// priority JQL clause any differently than any other field, but there's no
// need for a server round-trip just to narrow down what's already fetched.
const PRIORITY_OPTIONS = ["Highest", "High", "Medium", "Low", "Lowest"];

// Jira's search/jql endpoint is cursor-paginated (an opaque nextPageToken),
// not numbered pages with a known total — the shared Pagination component
// assumes the latter, so this is a small local Previous/Next control instead.
function CursorPagination({ pageNumber, hasPrevious, hasNext, onPrevious, onNext }) {
  if (!hasPrevious && !hasNext) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="inline-flex items-center gap-1 rounded-control px-2.5 py-1.5 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <span className="text-xs text-ink-muted">Page {pageNumber}</span>

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className="inline-flex items-center gap-1 rounded-control px-2.5 py-1.5 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

const SEARCH_DEBOUNCE_MS = 300;

export default function Issues() {
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Sprints depend on the selected project (via its board) — see
  // GET /jira/sprints. Kept separate from `projects` since it's re-fetched
  // every time the project filter changes rather than loaded once up front.
  const [sprints, setSprints] = useState([]);
  const [sprintFilter, setSprintFilter] = useState("");
  const [sprintsLoading, setSprintsLoading] = useState(false);

  // Cursor pagination: `currentToken` is the pageToken sent for the page
  // currently on screen (undefined for the first page); `tokenStack` holds
  // the tokens for every page visited before it, so "Previous" can pop back.
  const [currentToken, setCurrentToken] = useState(undefined);
  const [tokenStack, setTokenStack] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notConnected, setNotConnected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Priority is filtered client-side on the already-fetched page, so it
  // deliberately does NOT reset pagination — it never changes the underlying
  // Jira query.
  useEffect(() => {
    setCurrentToken(undefined);
    setTokenStack([]);
  }, [projectFilter, statusFilter, debouncedQuery, sprintFilter]);

  useEffect(() => {
    getJiraProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    setSprintFilter("");
    if (!projectFilter) {
      setSprints([]);
      return;
    }

    let cancelled = false;
    setSprintsLoading(true);
    getSprints(projectFilter)
      .then((data) => {
        if (!cancelled) setSprints(data);
      })
      .catch(() => {
        if (!cancelled) setSprints([]);
      })
      .finally(() => {
        if (!cancelled) setSprintsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getJiraIssues({
      project: projectFilter,
      status: statusFilter,
      search: debouncedQuery,
      sprint: sprintFilter,
      pageToken: currentToken,
    })
      .then((data) => {
        if (cancelled) return;
        setIssues(data.issues);
        setNextPageToken(data.nextPageToken);
        setNotConnected(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 400) {
          setNotConnected(true);
        } else {
          setError(err.message || "Failed to load Jira issues.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectFilter, statusFilter, debouncedQuery, sprintFilter, currentToken]);

  function handleNext() {
    if (!nextPageToken) return;
    setTokenStack((prev) => [...prev, currentToken]);
    setCurrentToken(nextPageToken);
  }

  function handlePrevious() {
    setTokenStack((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const previousToken = copy.pop();
      setCurrentToken(previousToken);
      return copy;
    });
  }

  const visibleIssues = priorityFilter
    ? issues.filter((issue) => issue.priority === priorityFilter)
    : issues;

  return (
    <AppShell title="Issues">
      {notConnected ? (
        <div className="bg-white border border-border rounded-card shadow-card py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <PlugZap className="h-5 w-5 text-ink-muted" />
          </div>
          <p className="text-sm font-medium text-ink">Jira isn&rsquo;t connected yet</p>
          <p className="text-sm text-ink-muted mt-1 mb-4">
            Connect your Jira Cloud account to see issues here.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3.5 py-2 transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white border border-border rounded-card shadow-card p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-full sm:w-44">
                <SearchableSelect
                  ariaLabel="Filter by project"
                  value={projectFilter}
                  onChange={setProjectFilter}
                  placeholder="All Projects"
                  options={[
                    { value: "", label: "All Projects" },
                    ...projects.map((project) => ({ value: project.key, label: project.name })),
                  ]}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="w-full sm:w-36 rounded-control border border-border px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <div className="w-full sm:w-48">
                <SearchableSelect
                  ariaLabel="Filter by sprint"
                  value={sprintFilter}
                  onChange={setSprintFilter}
                  disabled={!projectFilter || sprintsLoading || sprints.length === 0}
                  placeholder={
                    !projectFilter
                      ? "Select a project first"
                      : sprintsLoading
                      ? "Loading sprints..."
                      : sprints.length === 0
                      ? "No sprints for this project"
                      : "All Sprints"
                  }
                  options={
                    sprints.length > 0
                      ? [
                          { value: "", label: "All Sprints" },
                          ...sprints.map((sprint) => ({
                            value: String(sprint.id),
                            label: `${sprint.name} (${sprint.state})`,
                          })),
                        ]
                      : []
                  }
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label="Filter by priority"
                className="w-full sm:w-36 rounded-control border border-border px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">All</option>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>

              <div className="w-full sm:w-64 sm:flex-1">
                <SearchInput value={query} onChange={setQuery} placeholder="Search issues..." />
              </div>

              <span className="shrink-0 text-sm text-ink-muted sm:ml-auto">
                {visibleIssues.length} ticket{visibleIssues.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
              {error}
            </p>
          )}

          {loading ? (
            <div className="bg-white border border-border rounded-card shadow-card flex flex-col items-center justify-center py-16">
              <Loader2 className="h-5 w-5 text-ink-muted animate-spin mb-2" />
              <p className="text-sm text-ink-muted">Loading issues from Jira...</p>
            </div>
          ) : visibleIssues.length === 0 ? (
            <div className="bg-white border border-border rounded-card shadow-card flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <SearchX className="h-5 w-5 text-ink-muted" />
              </div>
              <p className="text-sm font-medium text-ink">No issues found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleIssues.map((issue) => (
                <IssueCard key={issue.key} issue={issue} />
              ))}
            </div>
          )}

          <CursorPagination
            pageNumber={tokenStack.length + 1}
            hasPrevious={tokenStack.length > 0}
            hasNext={Boolean(nextPageToken)}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </>
      )}
    </AppShell>
  );
}
