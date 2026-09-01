import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Reserved status colors — same hexes as the status pills, never themed.
const STATUS_ORDER = ["New", "Assigned", "In Progress", "Done"];
const STATUS_COLORS = {
  New: "#64748B",
  Assigned: "#2563EB",
  "In Progress": "#F59E0B",
  Done: "#10B981",
};

export default function StatusChart({ workOrders }) {
  const data = STATUS_ORDER.map((status) => ({
    name: status,
    value: workOrders.filter((wo) => wo.status === status).length,
  }));
  const hasData = data.some((entry) => entry.value > 0);

  return (
    <div className="bg-white border border-border rounded-card shadow-card p-5">
      <h2 className="text-sm font-semibold text-ink">Work Orders by Status</h2>
      <p className="text-xs text-ink-muted mt-0.5 mb-2">Distribution across the pipeline</p>

      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value} work order${value === 1 ? "" : "s"}`, ""]}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#F1E4D8",
                fontSize: 12,
              }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              iconSize={8}
              formatter={(value, entry) => (
                <span className="text-xs text-ink">
                  {value} <span className="text-ink-muted">({entry.payload.value})</span>
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-ink-muted py-16 text-center">No work orders yet.</p>
      )}
    </div>
  );
}
