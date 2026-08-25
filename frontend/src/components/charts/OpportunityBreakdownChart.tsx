import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { OpportunityScoreResult } from "../../types";

export function OpportunityBreakdownChart({ result }: { result: OpportunityScoreResult }) {
  const data = Object.values(result.subScores).map((s) => ({
    name: s.label,
    score: s.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => (value === null || value === undefined ? "No data" : value)}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.score === null
                  ? "var(--border)"
                  : entry.score >= 70
                    ? "#15803d"
                    : entry.score >= 40
                      ? "#a16207"
                      : "#b91c1c"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
