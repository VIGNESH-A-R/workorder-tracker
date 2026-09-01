import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function buildData(workOrders) {
  const counts = new Map();
  for (const wo of workOrders) {
    const name = wo.technician?.name || "Unassigned";
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default function TechnicianChart({ workOrders }) {
  const data = buildData(workOrders);

  return (
    <div className="bg-white border border-border rounded-card shadow-card p-5">
      <h2 className="text-sm font-semibold text-ink">Work Orders by Technician</h2>
      <p className="text-xs text-ink-muted mt-0.5 mb-2">Current workload per assignee</p>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#F1E4D8" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={{ stroke: "#F1E4D8" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value} work order${value === 1 ? "" : "s"}`, ""]}
              cursor={{ fill: "#FFF7ED" }}
              contentStyle={{ borderRadius: 8, borderColor: "#F1E4D8", fontSize: 12 }}
            />
            <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-ink-muted py-16 text-center">No work orders yet.</p>
      )}
    </div>
  );
}
