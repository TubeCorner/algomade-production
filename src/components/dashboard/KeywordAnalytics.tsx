"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import type { TrendRow } from "@/types/trends";

interface Keyword {
  id: string;
  keyword: string;
  source?: string; // "ai" | "youtube" | "manual"
  created_at: string;
}

interface KeywordAnalyticsProps {
  keywords: Keyword[];
  trends: Record<string, TrendRow>;
  onFilterChange?: (
    type: "source" | "trend" | "none",
    value: string | null
  ) => void;
}

export default function KeywordAnalytics({
  keywords,
  trends,
  onFilterChange,
}: KeywordAnalyticsProps) {
  const [activeFilter, setActiveFilter] = useState<{
    type: "source" | "trend" | "none";
    value: string | null;
  }>({
    type: "none",
    value: null,
  });

  /* -------------------------------------------------------------------------- */
  /* 📊 Derived Stats                                                          */
  /* -------------------------------------------------------------------------- */

  const trendCounts = useMemo(() => {
  return Object.values(trends).reduce(
    (acc, row) => {
      const dir = row?.direction ?? "stable";

      if (dir === "rising") acc.rising++;
      else if (dir === "falling") acc.falling++;
      else if (dir === "error") acc.error++;
      else acc.stable++;

      return acc;
    },
    { rising: 0, falling: 0, stable: 0, error: 0 }
  );
}, [trends]);

  const totalTrends =
    trendCounts.rising + trendCounts.falling + trendCounts.stable + trendCounts.error;

  const trendData = useMemo(
    () => [
      { key: "rising", name: "📈 Rising", value: trendCounts.rising },
      { key: "falling", name: "📉 Falling", value: trendCounts.falling },
      { key: "stable", name: "⚖ Stable", value: trendCounts.stable },
      { key: "error", name: "❌ Error", value: trendCounts.error },
    ],
    [trendCounts]
  );

  const sourceCounts = useMemo(() => {
    return keywords.reduce(
      (acc, kw) => {
        const src = kw.source ?? "manual";
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      },
      { ai: 0, youtube: 0, manual: 0 } as Record<string, number>
    );
  }, [keywords]);

  const sourceData = useMemo(
    () => [
      { key: "ai", name: "🧠 AI", value: sourceCounts.ai },
      { key: "youtube", name: "📺 YouTube", value: sourceCounts.youtube },
      { key: "manual", name: "✍️ Manual", value: sourceCounts.manual },
    ],
    [sourceCounts]
  );

  const totalKeywords = keywords.length;

  const TREND_COLORS = {
    rising: "#22c55e",
    falling: "#ef4444",
    stable: "#a1a1aa",
    error: "#f59e0b",
  };
  const SOURCE_COLORS = {
    ai: "#a855f7",
    youtube: "#3b82f6",
    manual: "#6b7280",
  };

  /* -------------------------------------------------------------------------- */
  /* 🧠 Filter Logic                                                            */
  /* -------------------------------------------------------------------------- */

  const applyFilter = (type: "source" | "trend" | "none", value: string | null) => {
    setActiveFilter({ type, value });
    onFilterChange?.(type, value);
    toast.dismiss();

    if (type === "none") {
      toast("Showing all keywords", { icon: "✨" });
    } else if (type === "source" && value) {
      toast.success(`Filtered by ${value.toUpperCase()} keywords`, { icon: "🎯" });
    } else if (type === "trend" && value) {
      toast(`Filtering by ${value} trend`, { icon: "📈" });
    }
  };

  const toggleFilter = (type: "source" | "trend", value: string) => {
    const isActive = activeFilter.type === type && activeFilter.value === value;
    applyFilter(isActive ? "none" : type, isActive ? null : value);
  };

  useEffect(() => {
    if (keywords.length === 0 && activeFilter.type !== "none") {
      applyFilter("none", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords.length]);

  /* -------------------------------------------------------------------------- */
  /* 🧭 UI                                                                      */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* 📊 Keyword Trend Summary Bar */}
      <div className="border rounded-lg shadow-sm bg-white p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📊 Keyword Trend Analytics
        </h3>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg">
            📈 Rising: {trendCounts.rising}
          </span>
          <span className="text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
            📉 Falling: {trendCounts.falling}
          </span>
          <span className="text-sm bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
            ⚖ Stable: {trendCounts.stable}
          </span>
          <span className="text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-lg">
            ❌ Error: {trendCounts.error}
          </span>
          <span className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg">
            Total: {totalTrends}
          </span>
        </div>

        {Object.keys(trends).length === 0 ? (
          <p className="text-gray-400 text-sm italic">
            No trend data yet. Fetch trends to see analytics.
          </p>
        ) : null}
      </div>

      {/* 📈 Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend Overview */}
        <div className="border rounded-lg shadow-sm p-5 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            📈 Keyword Trend Overview
          </h3>

          {Object.keys(trends).length === 0 ? (
            <p className="text-gray-400 text-sm italic">No trend data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  onClick={(d) => {
                    // @ts-ignore recharts typing
                    const key = d?.activePayload?.[0]?.payload?.key as string | undefined;
                    if (key) toggleFilter("trend", key);
                  }}
                >
                  {trendData.map((item, i) => (
                    <Cell
                      key={item.key}
                      fill={TREND_COLORS[item.key as keyof typeof TREND_COLORS]}
                      opacity={
                        activeFilter.type === "trend" &&
                        activeFilter.value &&
                        activeFilter.value !== item.key
                          ? 0.5
                          : 1
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Source Distribution */}
        <div className="border rounded-lg shadow-sm p-5 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            🧠 Source Distribution
          </h3>

          {keywords.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No keywords yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  label={({ name, value }) => `${name} (${value})`}
                  onClick={(_, index) => {
                    const key = sourceData[index]?.key;
                    if (key) toggleFilter("source", key);
                  }}
                >
                  {sourceData.map((item) => (
                    <Cell
                      key={item.key}
                      fill={SOURCE_COLORS[item.key as keyof typeof SOURCE_COLORS]}
                      opacity={
                        activeFilter.type === "source" &&
                        activeFilter.value &&
                        activeFilter.value !== item.key
                          ? 0.5
                          : 1
                      }
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
