import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getGitHubCredentials, saveGitHubCredentials } from "../api.js";

const inputClass =
  "w-full rounded-control border border-border px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";
const labelClass = "block text-sm font-medium text-ink mb-1.5";

// `bare`: skip the outer bordered/shadowed card wrapper — used when this is
// rendered as one section inside Settings' own panel (which already
// provides the border), rather than as a standalone card.
export default function GitHubIntegrationCard({ bare = false }) {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectedOwner, setConnectedOwner] = useState(null);
  const [connectedRepo, setConnectedRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getGitHubCredentials()
      .then((creds) => {
        setConnected(creds.connected);
        if (creds.connected) {
          setConnectedOwner(creds.owner);
          setConnectedRepo(creds.repo);
          setOwner(creds.owner);
          setRepo(creds.repo);
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
      const creds = await saveGitHubCredentials({ owner, repo, token });
      setConnected(true);
      setConnectedOwner(creds.owner);
      setConnectedRepo(creds.repo);
      setToken("");
    } catch (err) {
      setError(err.message || "Failed to connect to GitHub.");
    } finally {
      setSubmitting(false);
    }
  }

  const content = (
    <>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-ink">GitHub Integration</h2>
        {!loading && connected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected · {connectedOwner}/{connectedRepo}
          </span>
        )}
      </div>

      {loading && <p className="text-xs text-ink-muted mb-4">Loading connection status...</p>}
      {!loading && !connected && <p className="text-xs text-ink-muted mb-4">Not connected yet.</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="githubOwner" className={labelClass}>
            Owner
          </label>
          <input
            id="githubOwner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={inputClass}
            placeholder="octocat"
          />
        </div>

        <div>
          <label htmlFor="githubRepo" className={labelClass}>
            Repo
          </label>
          <input
            id="githubRepo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className={inputClass}
            placeholder="hello-world"
          />
        </div>

        <div>
          <label htmlFor="githubToken" className={labelClass}>
            Personal Access Token
          </label>
          <input
            id="githubToken"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className={inputClass}
            placeholder={connected ? "Leave blank to keep current token" : "Paste your personal access token"}
          />
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
    </>
  );

  if (bare) return content;

  return <div className="bg-white border border-border rounded-card shadow-card p-6">{content}</div>;
}
