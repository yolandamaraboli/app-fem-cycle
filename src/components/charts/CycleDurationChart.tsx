import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface CycleDurationChartProps {
  /** Array of cycle durations (last 12 max) */
  durations: number[];
  /** Average duration for reference line */
  average: number | null;
  /** Indices of anomalous cycles (relative to durations array) */
  anomalyIndices: Set<number>;
  /** Labels */
  labels: {
    cycle: string;
    days: string;
    average: string;
  };
}

export function CycleDurationChart({
  durations,
  average,
  anomalyIndices,
  labels,
}: CycleDurationChartProps) {
  const data = durations.map((duration, index) => ({
    name: `${labels.cycle} ${index + 1}`,
    duration,
    isAnomaly: anomalyIndices.has(index),
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#6B7280' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6B7280' }}
          label={{ value: labels.days, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
        />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
          formatter={(value: number) => [`${value} ${labels.days}`, labels.cycle]}
        />
        {average !== null && (
          <ReferenceLine
            y={average}
            stroke="#EE6B8A"
            strokeDasharray="5 5"
            label={{ value: labels.average, position: 'right', style: { fontSize: 11, fill: '#EE6B8A' } }}
          />
        )}
        <Line
          type="monotone"
          dataKey="duration"
          stroke="#9B7ED8"
          strokeWidth={2}
          dot={(props: { cx: number; cy: number; index: number }) => {
            const { cx, cy, index } = props;
            const isAnomaly = anomalyIndices.has(index);
            return (
              <circle
                key={`dot-${index}`}
                cx={cx}
                cy={cy}
                r={isAnomaly ? 6 : 4}
                fill={isAnomaly ? '#FA6364' : '#9B7ED8'}
                stroke={isAnomaly ? '#FA6364' : '#9B7ED8'}
                strokeWidth={2}
              />
            );
          }}
          activeDot={{ r: 6, fill: '#EE6B8A' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
