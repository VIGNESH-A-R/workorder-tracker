import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { getJiraCredentials, saveJiraCredentials } from "../api.js";

const inputClass =
  "w-full rounded-control border border-border px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";
const labelClass = "block text-sm font-medium text-ink mb-1.5";

export default function JiraIntegrationCard() {
  const [siteUrl, setSiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState(null);
  const [connectedSiteUrl, setConnectedSiteUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getJiraCredentials()
      .then((creds) => {
        setConnected(creds.connected);
        if (creds.connected) {
          setConnectedEmail(creds.email);
          setConnectedSiteUrl(creds.siteUrl);
          setSiteUrl(creds.siteUrl);
          setEmail(creds.email);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const creds = await saveJiraCredentials({ siteUrl, email, apiToken });
      setConnected(true);
      setConnectedEmail(creds.email);
      setConnectedSiteUrl(creds.siteUrl);
      setApiToken("");
    } catch (err) {
      setError(err.message || "Failed to connect to Jira.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-card shadow-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-ink">Jira Integration</h2>
        {!loading && connected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected · {connectedSiteUrl}
          </span>
        )}
      </div>

      {!loading && connected && (
        <p className="text-xs text-ink-muted mb-4">Connected as {connectedEmail}</p>
      )}
      {loading && <p className="text-xs text-ink-muted mb-4">Loading connection status...</p>}
      {!loading && !connected && (
        <p className="text-xs text-ink-muted mb-4">Not connected yet.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="jiraSiteUrl" className={labelClass}>
            Jira Site URL
          </label>
          <input
            id="jiraSiteUrl"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            className={inputClass}
            placeholder="yourcompany.atlassian.net"
          />
        </div>

        <div>
          <label htmlFor="jiraEmail" className={labelClass}>
            Email
          </label>
          <input
            id="jiraEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@yourcompany.com"
          />
        </div>

        <div>
          <label htmlFor="jiraApiToken" className={labelClass}>
            API Token
          </label>
          <input
            id="jiraApiToken"
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            className={inputClass}
            placeholder={connected ? "Leave blank to keep current token" : "Paste your API token"}
          />
          <p className="text-xs text-ink-muted mt-1.5 flex items-center gap-1">
            <ExternalLink className="h-3 w-3 shrink-0" />
            Generate an API token from your Atlassian account settings.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
            {error}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-control bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? "Testing connection..." : "Save & Test Connection"}
          </button>
        </div>
      </form>
    </div>
  );
}
