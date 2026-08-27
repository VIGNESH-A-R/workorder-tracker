import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, LogIn } from "lucide-react";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.status === 401 ? "Incorrect username or password." : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-control bg-primary flex items-center justify-center shadow-card">
            <ClipboardList className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="mt-3 text-xl font-semibold text-ink">WorkFlow</h1>
          <p className="text-sm text-ink-muted">Work order management, done right</p>
        </div>

        <div className="bg-white border border-border rounded-card shadow-card p-6">
          <h2 className="text-base font-semibold text-ink mb-1">Sign in</h2>
          <p className="text-sm text-ink-muted mb-5">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-ink mb-1.5">
                Username
              </label>
              <input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-control border border-border px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                placeholder="admin"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-control border border-border px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-control bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium py-2.5 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-4 bg-slate-100/80 border border-border rounded-card px-4 py-3 text-xs text-ink-muted space-y-1">
          <p className="font-medium text-ink">Demo credentials</p>
          <p>Administrator — admin / Admin@123</p>
          <p>Dispatcher — dispatcher / Dispatch@123</p>
        </div>
      </div>
    </div>
  );
}
