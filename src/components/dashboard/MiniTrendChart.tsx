"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniTrendChartProps {
  data: { date: string; value: number }[];
}

export default function MiniTrendChart({ data }: MiniTrendChartProps) {
  if (!data || data.length === 0) return null;

  // 🎯 Compute trend color
  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const rising = last > first;
  const falling = last < first;
  const color = rising
    ? "#22c55e" // green
    : falling
    ? "#ef4444" // red
    : "#9ca3af"; // gray

  return (
    <div
      className="w-[60px] h-[28px] flex items-center justify-center"
      style={{ minWidth: "60px", minHeight: "28px" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
