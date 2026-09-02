import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, PlugZap, SearchX } from "lucide-react";
import SearchInput from "../../../shared/components/SearchInput.jsx";
import SearchableSelect from "../../../shared/components/SearchableSelect.jsx";
import FiltersPopover from "./FiltersPopover.jsx";
import IssueListRow from "./IssueListRow.jsx";
import { getJiraIssues, getJiraProjects, getSprints } from "../../jira/api.js";
import { getGitHubIssues } from "../../github/api.js";

// Fixed list for now — the backend forwards whatever is picked straight into
// a JQL `status = "..."` clause; Jira's actual status set varies per project.
const STATUS_OPTIONS = ["To Do", "In Progress", "Done"];
const PRIORITY_OPTIONS = ["Highest", "High", "Medium", "Low", "Lowest"];
const GITHUB_STATE_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "all", label: "All" },
  { value: "closed", label: "Closed" },
];
const SEARCH_DEBOUNCE_MS = 300;

const selectClass =
  "w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer";
const fieldLabelClass = "block text-[11px] font-medium text-slate-500 mb-1";

function NotConnectedState({ providerLabel }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <PlugZap className="h-4 w-4 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">{providerLabel} isn&rsquo;t connected</p>
      <p className="text-xs text-slate-500 mt-1 mb-3">Connect it in Settings to see issues here.</p>
      <Link to="/settings" className="text-xs font-medium text-primary hover:text-primary-hover">
        Go to Settings
      </Link>
    </div>
  );
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function JiraList({ selectedKey, onSelect, onResultsChange }) {
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, SEARCH_DEBOUNCE_MS);

  const [sprints, setSprints] = useState([]);
  const [sprintFilter, setSprintFilter] = useState("");
  const [sprintsLoading, setSprintsLoading] = useState(false);

  const [currentToken, setCurrentToken] = useState(undefined);
  const [tokenStack, setTokenStack] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notConnected, setNotConnected] = useState(false);

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

  const visibleIssues = priorityFilter ? issues.filter((issue) => issue.priority === priorityFilter) : issues;
  const visibleKeysSignature = visibleIssues.map((issue) => issue.key).join(",");

  // Reports the currently-visible (post client-side priority filter) list up
  // to the workspace so it can auto-select the first ticket — fires whenever
  // that set actually changes (fetch settled with new results), not on every
  // unrelated re-render. Keyed off a signature string rather than the array
  // reference so it doesn't re-fire just because `.filter()` made a new array
  // with the same contents.
  useEffect(() => {
    if (loading) return;
    onResultsChange(visibleIssues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKeysSignature, loading]);

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

  const activeFilterCount = [projectFilter, statusFilter, sprintFilter, priorityFilter].filter(Boolean).length;

  if (notConnected) return <NotConnectedState providerLabel="Jira" />;

  return (
    <>
      <div className="px-3 pt-3 pb-2 space-y-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search issues..." />
          <FiltersPopover activeCount={activeFilterCount}>
            <div>
              <label className={fieldLabelClass}>Project</label>
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
            <div>
              <label className={fieldLabelClass}>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabelClass}>Sprint</label>
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
            <div>
              <label className={fieldLabelClass}>Priority</label>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={selectClass}>
                <option value="">All</option>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </FiltersPopover>
        </div>
      </div>

      <IssueResultsList loading={loading} error={error} providerLabel="Jira" issues={visibleIssues} selectedKey={selectedKey} onSelect={onSelect} />

      {(tokenStack.length > 0 || nextPageToken) && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={tokenStack.length === 0}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!nextPageToken}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}

function GitHubList({ selectedKey, onSelect, onResultsChange }) {
  const [stateFilter, setStateFilter] = useState("open");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, SEARCH_DEBOUNCE_MS);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notConnected, setNotConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getGitHubIssues(stateFilter, debouncedQuery)
      .then((data) => {
        if (cancelled) return;
        setIssues(data.issues);
        setNotConnected(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 400) {
          setNotConnected(true);
        } else {
          setError(err.message || "Failed to load GitHub issues.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stateFilter, debouncedQuery]);

  const visibleKeysSignature = issues.map((issue) => issue.key).join(",");

  useEffect(() => {
    if (loading) return;
    onResultsChange(issues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKeysSignature, loading]);

  const activeFilterCount = stateFilter !== "open" ? 1 : 0;

  if (notConnected) return <NotConnectedState providerLabel="GitHub" />;

  return (
    <>
      <div className="px-3 pt-3 pb-2 space-y-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search issues..." />
          <FiltersPopover activeCount={activeFilterCount}>
            <div>
              <label className={fieldLabelClass}>State</label>
              <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className={selectClass}>
                {GITHUB_STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </FiltersPopover>
        </div>
      </div>

      <IssueResultsList loading={loading} error={error} providerLabel="GitHub" issues={issues} selectedKey={selectedKey} onSelect={onSelect} />
    </>
  );
}

function IssueResultsList({ loading, error, providerLabel, issues, selectedKey, onSelect }) {
  if (error) {
    return (
      <p className="m-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2.5 py-2">{error}</p>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <Loader2 className="h-4 w-4 text-slate-400 animate-spin mb-2" />
        <p className="text-xs text-slate-500">Loading from {providerLabel}...</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
          <SearchX className="h-4 w-4 text-slate-400" />
        </div>
        <p className="text-xs font-medium text-slate-600">No issues found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
      {issues.map((issue) => (
        <IssueListRow key={issue.key} issue={issue} selected={issue.key === selectedKey} onSelect={() => onSelect(issue)} />
      ))}
    </div>
  );
}

export default function IssueListPanel({ provider, selectedKey, onSelect, onResultsChange }) {
  return (
    <aside className="w-[320px] shrink-0 border-r border-slate-200 flex flex-col min-h-0 bg-white">
      {provider === "github" ? (
        <GitHubList selectedKey={selectedKey} onSelect={onSelect} onResultsChange={onResultsChange} />
      ) : (
        <JiraList selectedKey={selectedKey} onSelect={onSelect} onResultsChange={onResultsChange} />
      )}
    </aside>
  );
}
