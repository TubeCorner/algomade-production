import { useMemo } from "react";
import {
  Keyword,
  TrendInfo,
  Opportunity,
  Source,
  TrendDirection,
} from "../components/dashboard/keywords-v2/types";
const opportunityRank: Record<Opportunity, number> = {
  explosive: 4,
  high: 3,
  medium: 2,
  low: 1,
};
interface Params {
  keywords: Keyword[];
  trendData: Record<string, TrendInfo>;
  source: "all" | Source;
  trend: "" | TrendDirection;
  sortByOpportunity: boolean;
}
export function useKeywordView({
  keywords,
  trendData,
  source,
  trend,
  sortByOpportunity,
}: Params) {
  return useMemo(() => {
    // 1️⃣ SOURCE FILTER (base list)
    let baseList = [...keywords];
    if (source !== "all") {
      baseList = baseList.filter((k) => k.source === source);
    }
    // 2️⃣ COUNTS (derived BEFORE trend filter)
    const counts = {
      all: baseList.length,
      ai: baseList.filter((k) => k.source === "ai").length,
      youtube: baseList.filter((k) => k.source === "youtube").length,
      manual: baseList.filter((k) => k.source === "manual").length,
    };
    // 3️⃣ TREND FILTER (single source of truth)
    let list = baseList;
    if (trend) {
      list = list.filter(
        (k) =>
          trendData[k.keyword.toLowerCase()]?.direction === trend
      );
    }
    // 4️⃣ SORT (NEVER FILTERS)
    if (sortByOpportunity) {
      list = [...list].sort((a, b) => {
        const aP =
          trendData[a.keyword.toLowerCase()]?.potential ?? "low";
        const bP =
          trendData[b.keyword.toLowerCase()]?.potential ?? "low";
        return opportunityRank[bP] - opportunityRank[aP];
      });
    }
    return { list, counts };
  }, [keywords, trendData, source, trend, sortByOpportunity]);
}

