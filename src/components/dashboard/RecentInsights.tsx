"use client";
import { useEffect, useState } from "react";

export default function RecentInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/recent-insights");
        const data = await res.json();
        setInsights(data.insights || []);
      } catch {
        console.error("Failed to load recent insights");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="text-sm text-gray-400 italic animate-pulse">
        Loading latest insights...
      </div>
    );

  if (insights.length === 0)
    return (
      <div className="text-sm text-gray-500">
        No new keyword insights in the past 7 days.
      </div>
    );

  return (
    <div className="space-y-3">
      {insights.map((i) => (
        <div
          key={i.keyword}
          className="border border-white/10 bg-white/5 rounded-lg p-3"
        >
          <div className="flex justify-between items-center">
            <p className="font-medium text-amber-300">{i.keyword}</p>
            <span className="text-xs text-gray-400">
              {new Date(i.updated_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">{i.recommended_action}</p>
          <p className="text-xs text-gray-500 mt-1">
            Difficulty: {i.difficulty_score}/100 | Avg Views:{" "}
            {i.avg_views.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
