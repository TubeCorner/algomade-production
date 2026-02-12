"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import toast from "react-hot-toast";
import { useQuotaManager } from "@/lib/useQuotaManager";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import KeywordTable from "./KeywordTable";

/* ---------------- Types ---------------- */
interface Keyword {
  id: string;
  keyword: string;
  source?: string;
  created_at: string;
}

interface TrendInfo {
  direction?: "rising" | "falling" | "stable" | string;
}

interface KeywordListProps {
  initialKeywords: Keyword[] | any;
  projectId: string;
  onKeywordChange: (keywords: Keyword[]) => void;
  trends?: Record<string, TrendInfo | string>;
  /* 🔽 ADD THESE */
  sortByOpportunity: boolean;
  onToggleSortOpportunity: () => void;
}

/* ---------------- Constants ---------------- */
const MAX_CONCURRENT = 3;

const opportunityRank: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/* ---------------- Opportunity Helper ---------------- */
function computeOpportunityLevel(
  chart?: any[],
  direction?: string,
  source?: string
): "high" | "medium" | "low" {
  if (!Array.isArray(chart) || chart.length < 2) return "low";

  const first = chart[0]?.value ?? 0;
  const last = chart[chart.length - 1]?.value ?? 0;
  const slope = last - first;

  let score = 0;

  if (direction === "rising") score += 2;
  else if (direction === "falling") score -= 2;

  if (slope > 10) score += 2;
  else if (slope > 0) score += 1;
  else score -= 1;

  if (source === "youtube") score += 1;

  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

export default function KeywordList({
  initialKeywords,
  projectId,
  onKeywordChange,
  trends = {},
  sortByOpportunity,
  onToggleSortOpportunity,
}: KeywordListProps) {
  const normalizeKeywords = (raw: any): Keyword[] => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.keywords)) return raw.keywords;
    return [];
  };

  const [keywords, setKeywords] = useState<Keyword[]>(
    normalizeKeywords(initialKeywords)
  );

  /* Filters */
  const [filter, setFilter] =
    useState<"all" | "ai" | "youtube" | "manual">("all");
  const [trendFilter, setTrendFilter] =
    useState<"" | "rising" | "falling" | "stable">("");

  /* Bulk */
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /* Trend metadata */
  const [trendData, setTrendData] =
    useState<Record<string, TrendInfo>>({});

  /* Chart data */
  const [chartData, setChartData] = useState<Record<string, any>>({});

  /* Chart queue */
  const inFlightCount = useRef(0);
  const queue = useRef<Set<string>>(new Set());

  /* Quota */
  const { usage, limit, reached, increment } = useQuotaManager();
  const [showUpgrade, setShowUpgrade] = useState(false);
  /* ---------------- AI + Video State ---------------- */

const [aiResults, setAiResults] = useState<any>({});
const [videoPacks, setVideoPacks] = useState<any>({});
const [expandedPackFor, setExpandedPackFor] = useState<string | null>(null);
const [aiLoading, setAiLoading] = useState<boolean>(false);


  /* Sync keywords */
  useEffect(() => {
    setKeywords(normalizeKeywords(initialKeywords));
  }, [initialKeywords]);

  /* Sync trends */
  useEffect(() => {
    const map: Record<string, TrendInfo> = {};
    Object.entries(trends || {}).forEach(([k, v]) => {
      map[k.toLowerCase()] =
        typeof v === "string" ? { direction: v } : v;
    });
    setTrendData(map);
  }, [trends]);

  /* ---------------- Chart Fetch ---------------- */
  const fetchChartInternal = useCallback(async (kw: string) => {
    try {
      const res = await fetch("/api/keywords/trends/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw }),
      });

      const json = await res.json();
      if (Array.isArray(json?.data)) {
        setChartData((prev) => ({ ...prev, [kw]: json.data }));
      }
    } finally {
      inFlightCount.current--;
      processQueue();
    }
  }, []);

  const processQueue = useCallback(() => {
    if (inFlightCount.current >= MAX_CONCURRENT) return;
    const kw = queue.current.values().next().value;
    if (!kw) return;

    queue.current.delete(kw);
    inFlightCount.current++;
    fetchChartInternal(kw);
  }, [fetchChartInternal]);

  const fetchChartData = useCallback(
    (rawKw: string) => {
      const kw = rawKw.toLowerCase();
      if (chartData[kw]) return;

      setChartData((prev) => ({ ...prev, [kw]: "__loading__" }));
      queue.current.add(kw);
      processQueue();
    },
    [chartData, processQueue]
  );

  /* ---------------- FILTER + SORT ---------------- */
  const visibleKeywords = useMemo(() => {
    let list = [...keywords];

    if (filter !== "all") {
      list = list.filter((k) => {
        const s = k.source?.toLowerCase();
        if (filter === "ai") return s === "ai";
        if (filter === "youtube") return s === "youtube" || s === "yt";
        if (filter === "manual") return !s;
        return true;
      });
    }

    if (trendFilter) {
      list = list.filter((k) => {
        const key = k.keyword.toLowerCase();
        const backend = trendData[key]?.direction?.toLowerCase();
        if (backend) return backend === trendFilter;

        const chart = chartData[key];
        if (!Array.isArray(chart) || chart.length < 2) return false;

        const first = chart[0]?.value ?? 0;
        const last = chart[chart.length - 1]?.value ?? 0;
        const inferred =
          last > first ? "rising" :
          last < first ? "falling" :
          "stable";

        return inferred === trendFilter;
      });
    }

    if (sortByOpportunity) {
      list = [...list].sort((a, b) => {
        const aKey = a.keyword.toLowerCase();
        const bKey = b.keyword.toLowerCase();

        const aLevel = computeOpportunityLevel(
          chartData[aKey],
          trendData[aKey]?.direction,
          a.source
        );

        const bLevel = computeOpportunityLevel(
          chartData[bKey],
          trendData[bKey]?.direction,
          b.source
        );

        const levelDiff =
          opportunityRank[bLevel] - opportunityRank[aLevel];
        if (levelDiff !== 0) return levelDiff;

        const aChart = chartData[aKey];
        const bChart = chartData[bKey];

        const aSlope =
          Array.isArray(aChart) && aChart.length > 1
            ? (aChart[aChart.length - 1]?.value ?? 0) -
              (aChart[0]?.value ?? 0)
            : 0;

        const bSlope =
          Array.isArray(bChart) && bChart.length > 1
            ? (bChart[bChart.length - 1]?.value ?? 0) -
              (bChart[0]?.value ?? 0)
            : 0;

        return bSlope - aSlope;
      });
    }

    return list;
  }, [
    keywords,
    filter,
    trendFilter,
    sortByOpportunity,
    trendData,
    chartData,
  ]);

  /* ---------------- CSV EXPORT (v2) ---------------- */
const handleExportCSV = () => {
  if (!visibleKeywords.length) {
    toast.error("No keywords to export");
    return;
  }

  const rows = visibleKeywords.map((k) => {
    const key = k.keyword.toLowerCase();
    const chart = chartData[key];
    const backendDirection = trendData[key]?.direction;

    // Trend inference fallback
    let trendDirection = backendDirection;
    let trendStrength = 0;

    if (!trendDirection && Array.isArray(chart) && chart.length > 1) {
      const first = chart[0]?.value ?? 0;
      const last = chart[chart.length - 1]?.value ?? 0;
      trendDirection =
        last > first ? "rising" :
        last < first ? "falling" :
        "stable";
      trendStrength = last - first;
    }

    const opportunity = computeOpportunityLevel(
      chart,
      trendDirection,
      k.source
    );

    // Simple action hints (safe, rule-based)
    const recommendedAction =
      opportunity === "high"
        ? "Create immediately"
        : opportunity === "medium"
        ? "Test with a short / angle"
        : "Low priority";

    const contentHint =
      trendDirection === "rising"
        ? "Trend-driven"
        : trendDirection === "falling"
        ? "Evergreen / legacy"
        : "Stable educational";

    return {
      keyword: k.keyword,
      source: k.source || "manual",
      trend_direction: trendDirection || "",
      trend_strength: trendStrength,
      opportunity_level: opportunity,
      recommended_action: recommendedAction,
      content_type_hint: contentHint,
      created_at: k.created_at,
    };
  });

  const headers = Object.keys(rows[0]).join(",");
  const csv = [
    headers,
    ...rows.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "algomade-keywords-v2.csv";
  link.click();

  URL.revokeObjectURL(url);
};
  /* ---------------- Delete ---------------- */
  const handleDelete = async (ids: string[]) => {
    try {
      const res = await fetch("/api/delete-keyword", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, projectId }),
      });

      if (!res.ok) throw new Error("Delete failed");

      const refreshed = await fetch(
        `/api/get-saved-keywords?project_id=${projectId}`
      );
      const json = await refreshed.json();
      const updated = normalizeKeywords(json);

      setKeywords(updated);
      onKeywordChange(updated);

      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <>
<KeywordTable
  keywords={visibleKeywords}
  trendData={trendData}
  chartData={chartData}
  fetchChartData={fetchChartData}

  sortByOpportunity={sortByOpportunity}
  onToggleSortOpportunity={onToggleSortOpportunity}
  onExportCSV={handleExportCSV}

  filter={filter}
  setFilter={setFilter}
  trendFilter={trendFilter}
  setTrendFilter={setTrendFilter}

  bulkMode={bulkMode}
  setBulkMode={setBulkMode}
  selectedIds={selectedIds}
  setSelectedIds={setSelectedIds}

  aiResults={aiResults}
  videoPacks={videoPacks}
  expandedPackFor={expandedPackFor}
  setExpandedPackFor={setExpandedPackFor}
  aiLoading={aiLoading}
  setAiLoading={setAiLoading}
  setVideoPacks={setVideoPacks}
  setAiResults={setAiResults}

  increment={increment}
  reached={reached}
  usage={usage}
  limit={limit}
  projectId={projectId}
  onDelete={handleDelete}
/>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}
