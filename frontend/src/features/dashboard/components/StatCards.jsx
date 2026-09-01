import { CheckCircle2, ClipboardList, FolderKanban } from "lucide-react";

const CARDS = [
  { key: "open", label: "Open", icon: FolderKanban, tint: "bg-blue-50 text-blue-600" },
  { key: "completed", label: "Completed", icon: CheckCircle2, tint: "bg-emerald-50 text-emerald-600" },
  { key: "total", label: "Total", icon: ClipboardList, tint: "bg-orange-50 text-primary" },
];

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {CARDS.map(({ key, label, icon: Icon, tint }) => (
        <div
          key={key}
          className="bg-white border border-border rounded-card shadow-card p-5 flex items-center gap-4"
        >
          <div className={`h-11 w-11 rounded-control flex items-center justify-center ${tint}`}>
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <div className="text-2xl font-semibold text-ink leading-tight">
              {stats ? stats[key] : "—"}
            </div>
            <div className="text-sm text-ink-muted">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
