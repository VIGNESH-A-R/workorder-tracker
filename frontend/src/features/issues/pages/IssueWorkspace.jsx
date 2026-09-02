import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Ticket } from "lucide-react";
import AppShell from "../../../shared/components/AppShell.jsx";
import IssueListPanel from "../components/IssueListPanel.jsx";
import TicketPanel from "../components/TicketPanel.jsx";
import { getActiveProvider } from "../../integrations/api.js";
import { getIssueDetail } from "../../jira/api.js";
import { getGitHubIssue } from "../../github/api.js";
import { runAiAnalysis } from "../../ai-analysis/api.js";
import { issueDetailPath, parseIssueRouteKey } from "../issueRoute.js";

export default function IssueWorkspace() {
  const { key: routeKey } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    getActiveProvider()
      .then((data) => setProvider(data.activeProvider))
      .catch(() => setProvider("jira"));
  }, []);

  const parsed = routeKey ? parseIssueRouteKey(routeKey) : null;
  const activeIssueKeyRef = useRef(null);
  useEffect(() => {
    activeIssueKeyRef.current = parsed ? `${parsed.source}:${parsed.id}` : null;
  }, [parsed?.source, parsed?.id]);

  const [issue, setIssue] = useState(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState(null);
  const [comments, setComments] = useState([]);
  const [noMatches, setNoMatches] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiHtml, setAiHtml] = useState(null);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (!parsed) {
      setIssue(null);
      setComments([]);
      setIssueLoading(false);
      setIssueError(null);
      return;
    }

    let cancelled = false;
    setIssueLoading(true);
    setIssueError(null);
    setIssue(null);
    setComments([]);
    setAiHtml(null);
    setAiError(null);

    const fetchIssue = parsed.source === "github" ? getGitHubIssue(parsed.id) : getIssueDetail(parsed.id);
    fetchIssue
      .then((data) => {
        if (cancelled) return;
        setIssue(data);
        setComments(data.comments);
      })
      .catch((err) => {
        if (!cancelled) setIssueError(err.message || "Failed to load this ticket.");
      })
      .finally(() => {
        if (!cancelled) setIssueLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [parsed?.source, parsed?.id]);

  // Tracks whether the list has reported its results at least once, so the
  // very first report (on mount) can respect an explicit deep link
  // (`/issues/:key` typed, refreshed, or navigated to from elsewhere, e.g.
  // Ticket Triage) instead of immediately overriding it with "first in
  // list". Every report after that first one DOES override the current
  // selection — that's what "whenever filters change, re-select first" means.
  const hasReportedResultsRef = useRef(false);

  function handleResultsChange(visibleIssues) {
    const isFirstReport = !hasReportedResultsRef.current;
    hasReportedResultsRef.current = true;

    if (isFirstReport && parsed) return;

    if (visibleIssues.length === 0) {
      setNoMatches(true);
      if (parsed) navigate("/issues", { replace: true });
      return;
    }

    setNoMatches(false);
    navigate(issueDetailPath(visibleIssues[0].key), { replace: true });
  }

  function handleSelect(listIssue) {
    navigate(issueDetailPath(listIssue.key));
  }

  async function handleRunAiAnalysis() {
    const keyAtStart = activeIssueKeyRef.current;
    setAiLoading(true);
    setAiError(null);
    try {
      const { html } = await runAiAnalysis(issue);
      if (activeIssueKeyRef.current !== keyAtStart) return; // navigated away meanwhile
      setAiHtml(html);
    } catch (err) {
      if (activeIssueKeyRef.current === keyAtStart) {
        setAiError(err.message || "AI analysis is temporarily unavailable.");
      }
    } finally {
      if (activeIssueKeyRef.current === keyAtStart) setAiLoading(false);
    }
  }

  return (
    <AppShell fullBleed titleIcon={Ticket} title="Issues">
      {provider === null ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
        </div>
      ) : (
        <>
          <IssueListPanel
            provider={provider}
            selectedKey={issue?.key}
            onSelect={handleSelect}
            onResultsChange={handleResultsChange}
          />

          {issueError ? (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <div>
                <p className="text-sm font-medium text-slate-700">Couldn&rsquo;t load this ticket</p>
                <p className="text-xs text-slate-500 mt-1">{issueError}</p>
              </div>
            </div>
          ) : issueLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
            </div>
          ) : issue && parsed ? (
            <TicketPanel
              issue={issue}
              source={parsed.source}
              aiLoading={aiLoading}
              aiHtml={aiHtml}
              aiError={aiError}
              onRunAiAnalysis={handleRunAiAnalysis}
              comments={comments}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-400">
                {noMatches ? "No issues match your filters" : "Select a ticket from the list"}
              </p>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
