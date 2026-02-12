import React from "react";
import { Keyword, TrendInfo } from "../keywords-v2/types";

interface KeywordTableProps {
  keywords: Keyword[];
  trendData: Record<string, TrendInfo>;
}

const KeywordTable: React.FC<KeywordTableProps> = ({ keywords, trendData }) => {
  return (
    <table className="min-w-full text-sm rounded border border-white/10 bg-[#0F172A]/60">
      <thead>
        <tr>
          <th className="p-2">Keyword</th>
          <th className="p-2">Source</th>
          <th className="p-2">Trend Direction</th>
          <th className="p-2">Opportunity Potential</th>
        </tr>
      </thead>
      <tbody>
        {keywords.map((kw) => {
          const trendInfo = trendData[kw.keyword.toLowerCase()];
          return (
            <tr key={kw.id} className="border-t border-white/20">
              <td className="p-2">{kw.keyword}</td>
              <td className="p-2">{kw.source}</td>
              <td className="p-2">{trendInfo?.direction || "N/A"}</td>
              <td className="p-2">{trendInfo?.potential || "low"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default KeywordTable;