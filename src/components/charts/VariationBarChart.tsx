import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

interface VariationBarChartProps {
  /** Signed variation between consecutive cycles */
  variations: number[];
  /** Labels */
  labels: {
    variation: string;
    days: string;
    pair: string;
  };
}

export function VariationBarChart({
  variations,
  labels,
}: VariationBarChartProps) {
  const data = variations.map((value, index) => ({
    name: `${labels.pair} ${index + 1}-${index + 2}`,
    variation: value,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
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
          formatter={(value: number) => [
            `${value > 0 ? '+' : ''}${value} ${labels.days}`,
            labels.variation,
          ]}
        />
        <ReferenceLine y={0} stroke="#9CA3AF" />
        <Bar dataKey="variation" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.variation > 0 ? '#FFB04C' : entry.variation < 0 ? '#4ECDC4' : '#9CA3AF'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
