import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import { getActiveProvider, setActiveProvider } from "../api.js";

const OPTIONS = [
  { value: "jira", label: "Jira" },
  { value: "github", label: "GitHub" },
];

export default function ActiveSourceCard() {
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getActiveProvider()
      .then((data) => setActive(data.activeProvider))
      .catch(() => setActive("jira"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(value) {
    if (value === active || updating) return;
    setUpdating(true);
    try {
      const data = await setActiveProvider(value);
      setActive(data.activeProvider);
      const label = OPTIONS.find((option) => option.value === data.activeProvider)?.label || data.activeProvider;
      toast.success(`Switched active ticket source to ${label}`);
    } catch (err) {
      toast.error(err.message || "Failed to switch active ticket source.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-card shadow-card p-6">
      <h2 className="text-sm font-semibold text-ink mb-1">Active Ticket Source</h2>
      <p className="text-xs text-ink-muted mb-4">
        Determines which provider the Issues, Ticket Optimization, and AI Analysis features read from.
      </p>

      {loading ? (
        <p className="text-xs text-ink-muted">Loading...</p>
      ) : (
        <div className="flex gap-3">
          {OPTIONS.map((option) => {
            const isActive = active === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                disabled={updating}
                className={`flex-1 flex items-center justify-between gap-2 rounded-control border px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:pointer-events-none ${
                  isActive
                    ? "border-primary bg-orange-50 text-primary-hover"
                    : "border-border text-ink hover:bg-slate-50"
                }`}
              >
                {option.label}
                {isActive && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
