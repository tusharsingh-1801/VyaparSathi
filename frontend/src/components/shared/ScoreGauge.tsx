// Lightweight hand-rolled SVG circular gauge for the two headline scores (Opportunity
// Score, Data Confidence) — lighter than pulling in recharts' RadialBarChart for one ring.
interface Props {
  value: number | null;
  max?: number;
  size?: number;
  label: string;
  suffix?: string;
}

export function ScoreGauge({ value, max = 100, size = 120, label, suffix = "" }: Props) {
  const stroke = size * 0.09;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value !== null ? Math.max(0, Math.min(value / max, 1)) : 0;
  const offset = circumference * (1 - pct);

  const color = value === null ? "var(--border)" : value >= 70 ? "#15803d" : value >= 40 ? "#a16207" : "#b91c1c";

  return (
    <div className="score-gauge" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        {value !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
        <text x="50%" y="48%" textAnchor="middle" className="score-gauge-value">
          {value !== null ? Math.round(value) : "—"}
          {value !== null && suffix}
        </text>
        <text x="50%" y="64%" textAnchor="middle" className="score-gauge-max">
          {value !== null ? `/ ${max}` : "n/a"}
        </text>
      </svg>
      <p className="score-gauge-label">{label}</p>
    </div>
  );
}
