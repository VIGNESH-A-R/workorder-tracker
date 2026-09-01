import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Quote,
  User,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../auth.jsx";
import LoginIllustration from "../components/LoginIllustration.jsx";

const FEATURES = [
  {
    icon: CheckCircle2,
    title: "Efficient",
    description: "Automate and simplify every step.",
  },
  {
    icon: Users,
    title: "Collaborative",
    description: "Empower your team to do more.",
  },
  {
    icon: BarChart3,
    title: "Insightful",
    description: "Make data-driven decisions.",
  },
];

function DotGrid() {
  const dots = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      dots.push({ cx: 8 + col * 18, cy: 8 + row * 18 });
    }
  }
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute top-8 right-8 w-24 h-24 opacity-40 hidden xl:block"
      aria-hidden="true"
    >
      {dots.map(({ cx, cy }) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" fill="#F97316" />
      ))}
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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

  function handleForgotPassword() {
    toast("Password reset isn't available in this demo.");
  }

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-amber-200/70 flex-col px-10 xl:px-14 py-6">
        <DotGrid />

        <div className="shrink-0 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-card shrink-0">
            <ClipboardList className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-lg font-bold text-ink leading-tight">WorkFlow</p>
            <p className="text-sm text-ink-muted">Work order management, done right</p>
          </div>
        </div>

        <div className="shrink-0 mt-5">
          <h1 className="text-3xl xl:text-4xl font-bold text-ink leading-tight">
            Streamline work.
            <br />
            <span className="text-primary">Deliver excellence.</span>
          </h1>
          <div className="w-14 h-1 bg-primary rounded-full mt-3 mb-3" />
          <p className="text-ink-muted max-w-sm">
            Organize tasks, empower teams, and delight customers.
          </p>
        </div>

        <div className="shrink-0 mt-4 bg-white/60 border border-orange-200/70 rounded-2xl p-4 max-w-sm">
          <Quote className="h-5 w-5 text-primary" fill="currentColor" strokeWidth={0} />
          <p className="text-ink text-sm leading-snug mt-2">
            &lsquo;The secret of getting ahead is getting started.&rsquo;
          </p>
          <p className="text-primary text-sm font-medium mt-2">— Mark Twain</p>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center py-2">
          <div className="h-full max-w-sm w-full mx-auto">
            <LoginIllustration />
          </div>
        </div>

        <div className="shrink-0 grid grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title}>
              <Icon className="h-5 w-5 text-primary mb-1.5" strokeWidth={2.25} />
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="text-xs text-ink-muted mt-0.5">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right sign-in panel */}
      <div className="flex-1 h-full overflow-y-auto relative flex items-center justify-center bg-surface px-4 py-6">
        <div className="w-full max-w-md">
          <div className="bg-white border border-border rounded-3xl shadow-card p-8 sm:p-10">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-card mb-4">
                <ClipboardList className="h-7 w-7 text-white" strokeWidth={2.25} />
              </div>
              <h2 className="text-2xl font-bold text-ink">Welcome back!</h2>
              <p className="text-sm text-ink-muted mt-1">Sign in to continue to WorkFlow</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-ink mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-border pl-10 pr-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-ink mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border pl-10 pr-10 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-ink cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-primary hover:text-primary-hover font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium py-3 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <LogIn className="h-4 w-4" />
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-6 bg-slate-50 border border-border rounded-xl px-4 py-3 text-xs text-ink-muted space-y-1">
              <p className="font-medium text-ink">Demo credentials</p>
              <p>Administrator — admin / Admin@123</p>
              <p>Dispatcher — dispatcher / Dispatch@123</p>
            </div>
          </div>
        </div>

        <p className="absolute bottom-6 inset-x-0 text-center text-xs text-ink-muted">
          © 2025 WorkFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
}
