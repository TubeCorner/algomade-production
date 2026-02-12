"use client";

import React, { useState } from "react";
import { useKeywordView } from "../../../hooks/useKeywordView";
import KeywordFilters from "./KeywordFilters";
import KeywordTable from "./KeywordTable";
import { Keyword, TrendInfo } from "../keywords-v2/types";

interface KeywordManagerProps {
  keywords: Keyword[];
  trendData: Record<string, TrendInfo>;
}

const KeywordManager: React.FC<KeywordManagerProps> = ({ keywords, trendData }) => {
  // UI state
  const [source, setSource] = useState<"all" | "ai" | "youtube" | "manual">("all");
  const [trend, setTrend] = useState<"" | "rising" | "falling" | "stable">("");
  const [sortByOpportunity, setSortByOpportunity] = useState(false);

  // Hook call
  const { list, counts } = useKeywordView({
    keywords,
    trendData,
    source,
    trend,
    sortByOpportunity,
  });

  return (
    <div>
      <KeywordFilters
        source={source}
        setSource={setSource}
        trend={trend}
        setTrend={setTrend}
        sortByOpportunity={sortByOpportunity}
        setSortByOpportunity={setSortByOpportunity}
        counts={counts}
      />
      <KeywordTable keywords={list} trendData={trendData} />
    </div>
  );
};

export default KeywordManager;

