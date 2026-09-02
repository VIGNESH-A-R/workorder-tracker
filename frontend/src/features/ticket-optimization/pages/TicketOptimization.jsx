import { useEffect, useState } from "react";
import { ListTree, Loader2, Sparkles } from "lucide-react";
import AppShell from "../../../shared/components/AppShell.jsx";
import SearchableSelect from "../../../shared/components/SearchableSelect.jsx";
import { getJiraProjects, getSprints } from "../../jira/api.js";
import { getGitHubIssues } from "../../github/api.js";
import { getActiveProvider } from "../../integrations/api.js";
import { runTicketOptimization, classifyTickets } from "../api.js";
import OptimizationTicketCard from "../components/OptimizationTicketCard.jsx";

// Presentation config per classification level — color scheme kept distinct
// from the priority-pill palette elsewhere in the app (blue/amber/red here
// reads as a severity scale, separate from IssuePills' priority colors).
const LEVELS = [
  {
    key: "L1",
    summaryLabel: "Basic / Simple",
    headingLabel: "BASIC / SIMPLE",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700",
    borderClass: "border-l-blue-500",
  },
  {
    key: "L2",
    summaryLabel: "Moderate Technical",
    headingLabel: "MODERATE TECHNICAL",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-700",
    borderClass: "border-l-amber-500",
  },
  {
    key: "L3",
    summaryLabel: "Advanced / Critical",
    headingLabel: "ADVANCED / CRITICAL",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700",
    borderClass: "border-l-red-500",
  },
];

const GITHUB_STATE_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "all", label: "All" },
];

// Summary cards: the first three carry an L1/L2/L3 tag (same pill style/
// colors as the level badge on each OptimizationTicketCard and the section
// heading dots below); the total card doesn't classify into a level, so it
// gets no tag.
function summaryCards(results) {
  return [
    ...LEVELS.map((level) => ({
      key: level.key,
      tag: level.key,
      badgeClass: level.badgeClass,
      label: level.summaryLabel,
      value: results[level.key].count,
    })),
    { key: "total", tag: null, label: "Categorized", value: results.total },
  ];
}

function OptimizationResults({ running, error, results, emptyHint }) {
  if (running) {
    return (
      <div className="bg-white border border-border rounded-card shadow-card flex flex-col items-center justify-center py-16">
        <Loader2 className="h-5 w-5 text-ink-muted animate-spin mb-2" />
        <p className="text-sm text-ink-muted">Classifying tickets...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
          {error}
        </p>
      )}

      {!results ? (
        <div className="bg-white border border-border rounded-card shadow-card flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <ListTree className="h-5 w-5 text-ink-muted" />
          </div>
          <p className="text-sm font-medium text-ink">No analysis yet</p>
          <p className="text-sm text-ink-muted mt-1">{emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryCards(results).map((card) => (
              <div
                key={card.key}
                className="bg-white border border-border rounded-card shadow-card p-5 text-center"
              >
                {card.tag && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${card.badgeClass}`}
                  >
                    {card.tag}
                  </span>
                )}
                <p className="text-3xl font-bold text-ink">{card.value}</p>
                <p className="text-xs text-ink-muted mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {LEVELS.filter((level) => results[level.key].count > 0).map((level) => (
            <section key={level.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2.5 w-2.5 rounded-full ${level.dotClass}`} />
                <h2 className="text-sm font-semibold text-ink">
                  {level.key} — {level.headingLabel} ({results[level.key].count})
                </h2>
              </div>
              <div className="space-y-3">
                {results[level.key].tickets.map((ticket) => (
                  <OptimizationTicketCard key={ticket.key} ticket={ticket} level={level} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function JiraTicketOptimization() {
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState("");

  // Sprints depend on the selected project (via its board) — same two-step
  // lookup as the Issues page's sprint filter.
  const [sprints, setSprints] = useState([]);
  const [sprintFilter, setSprintFilter] = useState("");
  const [sprintsLoading, setSprintsLoading] = useState(false);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

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

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const data = await runTicketOptimization(projectFilter, sprintFilter);
      setResults(data);
    } catch (err) {
      setError(err.message || "Ticket Triage is temporarily unavailable.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppShell titleIcon={ListTree} title="Ticket Triage">
      <div className="bg-white border border-border rounded-card shadow-card p-4 mb-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="w-full sm:w-56">
            <SearchableSelect
              ariaLabel="Filter by project"
              value={projectFilter}
              onChange={setProjectFilter}
              placeholder="Select a project"
              options={[
                { value: "", label: "Select a project" },
                ...projects.map((project) => ({ value: project.key, label: project.name })),
              ]}
            />
          </div>

          <div className="w-full sm:w-56">
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

          <button
            type="button"
            onClick={handleRun}
            disabled={!projectFilter || !sprintFilter || running}
            className="inline-flex items-center gap-1.5 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3.5 py-2 transition-colors disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {running ? "Running..." : "Run Ticket Triage"}
          </button>
        </div>
      </div>

      <OptimizationResults
        running={running}
        error={error}
        results={results}
        emptyHint="Select a project and sprint, then run ticket triage to see results."
      />
    </AppShell>
  );
}

function GitHubTicketOptimization() {
  const [stateFilter, setStateFilter] = useState("open");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const { issues } = await getGitHubIssues(stateFilter);
      if (issues.length === 0) {
        setError("No tickets found in the connected repo.");
        setResults(null);
        return;
      }

      // GitHub issue comments aren't fetched here (would be one request per
      // issue) — classification still works from title/description/status.
      const tickets = issues.map((issue) => ({
        key: issue.key,
        summary: issue.summary,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        project: issue.project,
        dueDate: issue.dueDate,
        assignee: issue.assignee || "Unassigned",
        comments: [],
      }));

      const data = await classifyTickets(tickets);
      setResults(data);
    } catch (err) {
      setError(err.message || "Ticket Triage is temporarily unavailable.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppShell titleIcon={ListTree} title="Ticket Triage">
      <div className="bg-white border border-border rounded-card shadow-card p-4 mb-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            aria-label="Filter by state"
            className="w-full sm:w-36 rounded-control border border-border px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
          >
            {GITHUB_STATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium px-3.5 py-2 transition-colors disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {running ? "Running..." : "Run Ticket Triage"}
          </button>
        </div>
      </div>

      <OptimizationResults
        running={running}
        error={error}
        results={results}
        emptyHint="Pick a state, then run ticket triage to see results."
      />
    </AppShell>
  );
}

export default function TicketOptimization() {
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    getActiveProvider()
      .then((data) => setProvider(data.activeProvider))
      .catch(() => setProvider("jira"));
  }, []);

  if (provider === null) {
    return (
      <AppShell titleIcon={ListTree} title="Ticket Triage">
        <div className="bg-white border border-border rounded-card shadow-card flex flex-col items-center justify-center py-16">
          <Loader2 className="h-5 w-5 text-ink-muted animate-spin mb-2" />
          <p className="text-sm text-ink-muted">Loading...</p>
        </div>
      </AppShell>
    );
  }

  return provider === "github" ? <GitHubTicketOptimization /> : <JiraTicketOptimization />;
}
