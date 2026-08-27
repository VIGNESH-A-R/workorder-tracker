import { useEffect, useState } from "react";
import { Phone, User, Wrench } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { getTechnicians } from "../api.js";

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTechnicians()
      .then(setTechnicians)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Technicians">
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
          Failed to load technicians: {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading...</p>
      ) : technicians.length === 0 ? (
        <div className="bg-white border border-border rounded-card shadow-card py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <User className="h-5 w-5 text-ink-muted" />
          </div>
          <p className="text-sm font-medium text-ink">No technicians yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech) => (
            <div key={tech.id} className="bg-white border border-border rounded-card shadow-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-primary flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{tech.name}</p>
                  {tech.specialty && (
                    <div className="flex items-center gap-1 text-xs text-ink-muted mt-0.5">
                      <Wrench className="h-3 w-3" />
                      {tech.specialty}
                    </div>
                  )}
                </div>
              </div>

              {tech.phone && (
                <div className="flex items-center gap-1.5 text-sm text-ink-muted mb-4">
                  <Phone className="h-3.5 w-3.5" />
                  {tech.phone}
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="flex-1 text-center">
                  <p className="text-lg font-semibold text-ink">{tech.workload.open}</p>
                  <p className="text-xs text-ink-muted">Open</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex-1 text-center">
                  <p className="text-lg font-semibold text-ink">{tech.workload.done}</p>
                  <p className="text-xs text-ink-muted">Done</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
