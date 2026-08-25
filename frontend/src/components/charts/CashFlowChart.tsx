import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CashFlowMonth } from "../../types";

export function CashFlowChart({ data }: { data: CashFlowMonth[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} label={{ value: "Month", position: "insideBottom", offset: -2, fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={70} />
        <Tooltip
          formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="operatingCosts" name="Operating costs" stroke="#a16207" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="emi" name="EMI" stroke="#b91c1c" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="cashReserve" name="Cash reserve" stroke="#15803d" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
