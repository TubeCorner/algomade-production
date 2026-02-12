import React from "react";
import KeywordFilters from "./KeywordFilters";
import KeywordTable from "./KeywordTable";
import { Keyword, TrendInfo } from "./types";

interface KeywordManagerLayoutProps {
  filtersProps: React.ComponentProps<typeof KeywordFilters>;
  keywords: Keyword[];
  trendData: Record<string, TrendInfo>;
}

const KeywordManagerLayout: React.FC<KeywordManagerLayoutProps> = ({ filtersProps, keywords, trendData }) => {
  return (
    <div className="p-4">
      <section className="mb-4">
        <h1 className="text-2xl font-bold">Keyword Manager</h1>
        <p className="text-gray-400">Saved keywords for this project</p>
      </section>

      <div className="mb-4 p-3 rounded-md bg-slate-800">
        {/* Keyword Filters */}
        <KeywordFilters {...filtersProps} />
      </div>

      <div className="rounded-md bg-neutral-900">
        {/* Keyword Table */}
        <KeywordTable keywords={keywords} trendData={trendData} />
      </div>
    </div>
  );
};

export default KeywordManagerLayout;