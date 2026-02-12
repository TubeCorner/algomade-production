"use client";

import React, { useEffect } from "react";
import KeywordRow from "./KeywordRow";
import toast from "react-hot-toast";

/* ---------------- Props ---------------- */
interface KeywordTableProps {
  keywords: any[];
  trendData: Record<string, any>;
  chartData: Record<string, any>;

  onToggleSortOpportunity: () => void;
  onExportCSV: () => void;

  filter: string;
  setFilter: (v: any) => void;
  trendFilter: string;
  setTrendFilter: (v: any) => void;

  bulkMode: boolean;
  setBulkMode: (v: boolean) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;

  increment: any;
  reached: boolean;
  usage: number;
  limit: number;

  projectId: string;
  onDelete: (ids: string[]) => Promise<void>;
  fetchChartData: (kw: string) => void;
}

/* ---------------- Component ---------------- */
export default function KeywordTable({
  keywords,
  trendData,
  chartData,

  sortByOpportunity,
  onToggleSortOpportunity,
  onExportCSV,

  filter,
  setFilter,
  trendFilter,
  setTrendFilter,

  bulkMode,
  setBulkMode,
  selectedIds,
  setSelectedIds,

  aiResults,              // ✅ must exist
  videoPacks,             // ✅ must exist
  expandedPackFor,
  setExpandedPackFor,
  aiLoading,
  setAiLoading,

  increment,
  reached,
  usage,
  limit,

  projectId,
  onDelete,
  fetchChartData,

  setVideoPacks,
  setAiResults,
}: KeywordTableProps) {

  /* ------------------------------------------------------------
     Trigger mini-chart fetch when keywords appear
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!fetchChartData || !Array.isArray(keywords)) return;

    keywords.forEach((k) => {
      if (k?.keyword) {
        fetchChartData(k.keyword);
      }
    });
  }, [keywords, fetchChartData]);

  /* ---------------------- Bulk Mode Logic ---------------------- */
  const toggleSelectAll = () => {
    if (selectedIds.length === keywords.length && keywords.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(keywords.map((k) => k.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return toast("No items selected");
    if (!confirm(`Delete ${selectedIds.length} keywords?`)) return;

    await onDelete(selectedIds);
    setSelectedIds([]);
    setBulkMode(false);
  };

  /* ---------------------- Counts ---------------------- */
  const totalCount = keywords.length;
  const aiCount = keywords.filter((k) => k.source === "ai").length;
  const youtubeCount = keywords.filter(
    (k) => k.source === "youtube" || k.source === "yt"
  ).length;
  const manualCount = keywords.filter((k) => !k.source).length;

  /* ---------------------- UI ------------------------ */
  return (
    <div className="overflow-x-auto text-gray-100">
      <div className="mb-4 space-y-3">
        {/* Title + Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Saved Keywords</h3>
            <p className="text-xs text-gray-400">
              {usage}/{limit} AI generations used today
              {reached && (
                <span className="text-red-400 ml-2">🚫 Limit reached</span>
              )}
            </p>
          </div>

          {!bulkMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSortOpportunity}
                className="px-3 py-1 rounded text-sm bg-slate-700 text-slate-200 hover:bg-slate-600"
              >
                Sort by Opportunity
              </button>

              <button
                onClick={onExportCSV}
                className="px-3 py-1 rounded text-sm bg-emerald-700 text-emerald-100 hover:bg-emerald-600"
              >
                ⬇ Export CSV
              </button>
            </div>
          )}
        </div>

        {/* Trend Filters */}
        <div className="flex justify-between items-center">
          {!bulkMode ? (
            <div className="flex items-center gap-3">
              {["rising", "falling", "stable"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTrendFilter(t)}
                  className={`text-xs px-3 py-1 rounded ${
                    trendFilter === t
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {t === "rising" && "📈 Rising"}
                  {t === "falling" && "📉 Falling"}
                  {t === "stable" && "⚖ Stable"}
                </button>
              ))}

              {trendFilter && (
                <button
                  onClick={() => setTrendFilter("")}
                  className="text-xs px-3 py-1 bg-yellow-200 text-yellow-800 rounded"
                >
                  ✖ Clear
                </button>
              )}

              <button
                onClick={() => setBulkMode(true)}
                className="text-sm text-gray-300 hover:text-white"
              >
                🗂 Manage
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setBulkMode(false);
                  setSelectedIds([]);
                }}
                className="text-sm text-gray-400 hover:text-gray-200"
              >
                Exit
              </button>

              <button
                onClick={toggleSelectAll}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded"
              >
                {selectedIds.length === keywords.length
                  ? "Unselect All"
                  : "Select All"}
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="text-xs px-3 py-1 bg-red-600 text-white rounded"
                >
                  Delete ({selectedIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Source Tabs */}
        <div className="flex items-center gap-3 bg-[#1E293B] border border-white/10 px-3 py-2 rounded-xl">
          {[
            { value: "all", label: "All", icon: "📋", count: totalCount },
            { value: "ai", label: "AI", icon: "🧠", count: aiCount },
            {
              value: "youtube",
              label: "YouTube",
              icon: "📈",
              count: youtubeCount,
            },
            {
              value: "manual",
              label: "Manual",
              icon: "✍️",
              count: manualCount,
            },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full ${
                filter === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <span>{tab.icon}</span>
              <span>
                {tab.label}
                <span className="ml-1 text-xs opacity-70">
                  ({tab.count})
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <table className="min-w-full text-sm rounded border border-white/10 bg-[#0F172A]/60">
        <tbody>
          {keywords.map((kw, i) => (
            <KeywordRow
              key={kw.id}
              index={i}
              kw={kw}
              trendData={trendData}
              chartData={chartData}
              aiResults={aiResults}
              videoPacks={videoPacks}
              expandedPackFor={expandedPackFor}
              setExpandedPackFor={setExpandedPackFor}
              aiLoading={aiLoading}
              setAiLoading={setAiLoading}
              increment={increment}
              reached={reached}
              projectId={projectId}
              onDelete={onDelete}
              fetchChartData={fetchChartData}
              setVideoPacks={setVideoPacks}
              setAiResults={setAiResults}
              bulkMode={bulkMode}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
