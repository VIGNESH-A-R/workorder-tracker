import { useState } from "react";
import { User } from "lucide-react";
import toast from "react-hot-toast";
import AppShell from "../../../shared/components/AppShell.jsx";
import { useAuth } from "../../auth/auth.jsx";
import JiraIntegrationCard from "../../jira/components/JiraIntegrationCard.jsx";

const inputClass =
  "w-full rounded-control border border-border px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";
const labelClass = "block text-sm font-medium text-ink mb-1.5";

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {};
      if (fullName && fullName !== user?.fullName) data.fullName = fullName;
      if (password) data.password = password;

      if (Object.keys(data).length === 0) {
        toast("Nothing to update");
        return;
      }

      await updateProfile(data);
      setPassword("");
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Settings">
      <div className="max-w-lg space-y-4">
        <div className="bg-white border border-border rounded-card shadow-card p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-full bg-orange-100 text-primary-hover flex items-center justify-center">
              <User className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{user?.fullName}</p>
              <p className="text-xs text-ink-muted">
                {user?.username} · {user?.role}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-card shadow-card p-6">
          <h2 className="text-sm font-semibold text-ink mb-4">Update Profile</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full Name
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-control bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <JiraIntegrationCard />
      </div>
    </AppShell>
  );
}
