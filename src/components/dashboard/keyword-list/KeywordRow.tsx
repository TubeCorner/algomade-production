"use client";

import React, { memo, useEffect } from "react";
import MiniTrendChart from "@/components/dashboard/MiniTrendChart";
import KeywordActionsMenu from "./KeywordActionsMenu";
import KeywordExpandableContent from "./KeywordExpandableContent";

/* ---------------- Skeleton ---------------- */
function MiniChartSkeleton() {
  return (
    <div className="w-[60px] h-[28px] rounded bg-slate-700/40 overflow-hidden relative">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />
    </div>
  );
}

/* ---------------- Direction Inference ---------------- */
function inferDirectionFromChart(chart?: any[]) {
  if (!Array.isArray(chart) || chart.length < 2) return undefined;

  const first = chart[0]?.value ?? 0;
  const last = chart[chart.length - 1]?.value ?? 0;

  if (last > first) return "rising";
  if (last < first) return "falling";
  return "stable";
}

/* ---------------- Opportunity Logic ---------------- */
function computeOpportunity({
  chart,
  direction,
  source,
}: {
  chart?: any[];
  direction?: string;
  source?: string;
}) {
  const reasons: string[] = [];

  if (!Array.isArray(chart) || chart.length < 2) {
    return { level: "low", reasons: ["Insufficient trend data"] };
  }

  const first = chart[0]?.value ?? 0;
  const last = chart[chart.length - 1]?.value ?? 0;
  const slope = last - first;

  let score = 0;

  if (direction === "rising") {
    score += 2;
    reasons.push("Search interest is rising");
  } else if (direction === "falling") {
    score -= 2;
    reasons.push("Search interest is falling");
  } else {
    reasons.push("Search interest is stable");
  }

  if (slope > 10) {
    score += 2;
    reasons.push("Strong upward trend");
  } else if (slope > 0) {
    score += 1;
    reasons.push("Moderate upward trend");
  } else {
    score -= 1;
    reasons.push("Flat or declining demand");
  }

  if (source === "youtube") {
    score += 1;
    reasons.push("Based on real YouTube search data");
  }

  let level: "high" | "medium" | "low" = "low";
  if (score >= 4) level = "high";
  else if (score >= 2) level = "medium";

  return { level, reasons };
}

export default memo(function KeywordRow({
  index,
  kw,
  trendData,
  chartData,
  aiResults,
  videoPacks,
  setExpandedPackFor,
  aiLoading,
  setAiLoading,
  increment,
  reached,
  onDelete,
  fetchChartData,
  setVideoPacks,
  setAiResults,

  /* Bulk */
  bulkMode,
  selectedIds,
  setSelectedIds,
}: any) {
  const key = kw.keyword.toLowerCase();

  const t = trendData?.[key] || {};
  const chart = chartData?.[key];
  const hasChart = Array.isArray(chart);

  // ✅ FIX: backend direction OR inferred from chart
  const direction =
    t?.direction || inferDirectionFromChart(chart);

  const opportunity = computeOpportunity({
    chart,
    direction,
    source: kw.source,
  });

  const meta = aiResults?.[kw.keyword];
  const pack = videoPacks?.[kw.keyword];
  const showExpanded = aiLoading === kw.keyword || meta || pack;

  /* Fetch chart once */
  useEffect(() => {
    if (hasChart) return;
    fetchChartData?.(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hasChart]);

  const toggleSelect = () => {
    setSelectedIds(
      selectedIds.includes(kw.id)
        ? selectedIds.filter((id: string) => id !== kw.id)
        : [...selectedIds, kw.id]
    );
  };

  return (
    <>
      <tr className={index % 2 === 0 ? "bg-[#1E293B]/40" : "bg-[#0F172A]/40"}>
        {bulkMode && (
          <td className="px-4 py-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(kw.id)}
              onChange={toggleSelect}
            />
          </td>
        )}

        {/* KEYWORD */}
        <td className="px-4 py-2 font-medium text-gray-200">
          <div className="flex justify-between gap-2">
            <span className="truncate max-w-[260px]">{kw.keyword}</span>

            {!bulkMode && (
              <KeywordActionsMenu
                keyword={kw.keyword}
                aiLoading={aiLoading}
                setAiLoading={setAiLoading}
                increment={increment}
                reached={reached}
                setAiResults={setAiResults}
                setVideoPacks={setVideoPacks}
                setExpandedPackFor={setExpandedPackFor}
              />
            )}
          </div>
        </td>

        {/* SOURCE */}
        <td className="px-4 py-2">
          {kw.source === "ai" && "AI"}
          {kw.source === "youtube" && "YT"}
          {!kw.source && "Manual"}
        </td>

        {/* TREND + MINI CHART */}
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            {direction === "rising" && <span className="text-green-400">📈</span>}
            {direction === "falling" && <span className="text-red-400">📉</span>}
            {direction === "stable" && <span className="text-gray-400">⚖</span>}

            {hasChart ? (
              <div className="w-[60px] h-[28px]">
                <MiniTrendChart data={chart} />
              </div>
            ) : (
              <MiniChartSkeleton />
            )}
          </div>
        </td>

        {/* OPPORTUNITY */}
        <td className="px-4 py-2">
          <div className="relative group inline-block">
            <span
              className={
                opportunity.level === "high"
                  ? "text-green-400 font-medium cursor-help"
                  : opportunity.level === "medium"
                  ? "text-yellow-400 font-medium cursor-help"
                  : "text-gray-400 cursor-help"
              }
            >
              {opportunity.level.charAt(0).toUpperCase() +
                opportunity.level.slice(1)}
            </span>

            <div className="absolute z-50 hidden group-hover:block left-1/2 -translate-x-1/2 mt-2 w-56 rounded-md bg-[#020617] border border-slate-700 shadow-lg p-3 text-xs text-slate-200">
              <div className="font-semibold mb-1">Why this score?</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {opportunity.reasons.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </td>

        {/* DATE */}
        <td className="px-4 py-2 text-xs text-gray-400">
          {new Date(kw.created_at).toLocaleDateString()}
        </td>

        {/* DELETE */}
        {!bulkMode && (
          <td className="px-4 py-2 text-right">
            <button
              onClick={() => onDelete?.([kw.id])}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
            >
              Delete
            </button>
          </td>
        )}
      </tr>

      {showExpanded && (
        <tr>
          <td colSpan={bulkMode ? 7 : 6} className="px-4 py-4 bg-[#020617]">
            <KeywordExpandableContent
              keyword={kw.keyword}
              aiLoading={aiLoading}
              meta={meta}
              pack={pack}
            />
          </td>
        </tr>
      )}
    </>
  );
});
