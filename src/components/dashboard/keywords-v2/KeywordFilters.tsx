"use client";

import React from "react";
import { Source, TrendDirection } from "./types";

interface Props {
  source: "all" | Source;
  setSource: (v: "all" | Source) => void;

  trend: "" | TrendDirection;
  setTrend: (v: "" | TrendDirection) => void;

  sortByOpportunity: boolean;
  setSortByOpportunity: (v: boolean) => void;

  counts: {
    all: number;
    ai: number;
    youtube: number;
    manual: number;
  };
}

export default function KeywordFilters({
  source,
  setSource,
  trend,
  setTrend,
  sortByOpportunity,
  setSortByOpportunity,
  counts,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Source filter */}
      <div className="flex gap-2">
        {(["all", "ai", "youtube", "manual"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`px-3 py-1 rounded ${
              source === s ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            {s} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Trend filter */}
      <div className="flex gap-2">
        {(["rising", "falling", "stable"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTrend(trend === t ? "" : t)}
            className={`px-3 py-1 rounded ${
              trend === t ? "bg-emerald-600" : "bg-slate-700"
            }`}
          >
            {t}
          </button>
        ))}

        <button
          onClick={() => setTrend("")}
          className="px-3 py-1 rounded bg-slate-600"
        >
          Clear
        </button>
      </div>

      {/* Sort */}
      <button
        onClick={() => setSortByOpportunity(!sortByOpportunity)}
        className={`px-3 py-1 rounded w-fit ${
          sortByOpportunity ? "bg-purple-600" : "bg-slate-700"
        }`}
      >
        Sort by Opportunity
      </button>
    </div>
  );
}

