"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

import { useDashboard } from "@/contexts/DashboardContext";

import KeywordControls from "@/components/dashboard/KeywordControls";
import KeywordList from "@/components/dashboard/keyword-list/KeywordList";

import KeywordAnalytics from "@/components/dashboard/KeywordAnalytics";
import UpgradeBanner from "@/components/dashboard/UpgradeBanner";
import UsageIndicator from "@/components/dashboard/UsageIndicator";
import RecentInsights from "@/components/dashboard/RecentInsights";
import { VideoLibrary } from "@/components/dashboard/VideoLibrary";
import type { TrendRow } from "@/types/trends";

interface Keyword {
  id: string;
  keyword: string;
  source?: string;
  created_at: string;
}

export default function DashboardPageContent() {
  const { projects, selectedProject } = useDashboard();

  const selectedProjectId =
    typeof selectedProject === "string"
      ? selectedProject
      : selectedProject?.id || null;

  /* -------------------------------------------------------------------------- */
  /* State                                                                      */
  /* -------------------------------------------------------------------------- */
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordTrends, setKeywordTrends] = useState<Record<string, TrendRow>>(
    {}
  );
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [showRecent, setShowRecent] = useState(true);
  const [sortByOpportunity, setSortByOpportunity] = useState(false);

  /* -------------------------------------------------------------------------- */
  /* Fetch Plan Tier                                                            */
  /* -------------------------------------------------------------------------- */
  const [planTier, setPlanTier] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const cached = sessionStorage.getItem("algomade_plan_tier");
        if (cached) {
          setPlanTier(cached);
          setLoadingPlan(false);
          return;
        }

        const res = await fetch("/api/user/plan");
        const data = await res.json();
        const plan = data.plan_tier || data.plan || "free";

        setPlanTier(plan);
        sessionStorage.setItem("algomade_plan_tier", plan);
      } catch (err) {
        console.error("Failed to fetch plan tier:", err);
      } finally {
        setLoadingPlan(false);
      }
    }

    fetchPlan();
  }, []);

  const isProUser = planTier === "pro";

  /* -------------------------------------------------------------------------- */
  /* Refresh Trigger for Video Library                                          */
  /* -------------------------------------------------------------------------- */
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* Fetch Saved Keywords                                                       */
  /* -------------------------------------------------------------------------- */
  const fetchKeywords = useCallback(
    async (silent = false) => {
      if (!selectedProjectId) return;

      setRefreshing(!silent);
      setLoadingKeywords(true);

      try {
        const res = await fetch(
          `/api/get-saved-keywords?project_id=${selectedProjectId}`
        );
        if (!res.ok) throw new Error("Failed to fetch keywords");

        const data = await res.json();

        // ⭐ FINAL NORMALIZATION FIX
        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.keywords)
            ? data.keywords
            : [];

        setKeywords(list);
      } catch (err) {
        console.error("Keyword fetch error:", err);
        toast.error("Unable to load keywords");
      } finally {
        setLoadingKeywords(false);
        setRefreshing(false);
      }
    },
    [selectedProjectId]
  );

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  /* -------------------------------------------------------------------------- */
  /* Fetch All Trends                                                           */
  /* -------------------------------------------------------------------------- */
  const fetchAllTrends = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      const res = await fetch(
        `/api/keywords/trends?project_id=${selectedProjectId}`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("Trend fetch failed");

      const data = await res.json();

     const trendMap: Record<string, TrendRow> = {};

Object.entries(data.trends || {}).forEach(([keyword, value]: any) => {
  trendMap[keyword.toLowerCase()] = {
    keyword: keyword.toLowerCase(),
    ...value,
  };
});

setKeywordTrends(trendMap);

    } catch (err) {
      console.error("Trend update error:", err);
      toast.error("Trend fetch failed");
    }
  }, [selectedProjectId]);

  /* -------------------------------------------------------------------------- */
  /* After Saving / Generating Keywords                                         */
  /* -------------------------------------------------------------------------- */
  const handleKeywordsSaved = useCallback(async () => {
    await fetchKeywords(true);
    await fetchAllTrends();
    handleDataRefresh();
    toast.success("Keywords updated ✓");
  }, [fetchKeywords, fetchAllTrends, handleDataRefresh]);

  /* -------------------------------------------------------------------------- */
  /* Trend Injection from Controls                                              */
  /* -------------------------------------------------------------------------- */
  const handleTrendsUpdate = useCallback((trendData: any) => {
    if (!trendData) return;

    setKeywordTrends((prev) => {
      const next = { ...prev };

      Object.entries(trendData).forEach(([k, v]: any) => {
        const normalizedKey = k.toLowerCase();

        next[normalizedKey] = {
          keyword: normalizedKey,
          direction: typeof v === "string" ? v : v.direction || "stable",
          velocity: v.velocity ?? 0,
          trend_7d: v.trend_7d ?? 0,
          trend_30d: v.trend_30d ?? 0,
          yt_avg_views: v.yt_avg_views ?? 0,
          yt_new_uploads: v.yt_new_uploads ?? 0,
          opportunity_score: v.opportunity ?? 0,
          updated_at: v.updated_at ?? null,
        };
      });

      return next;
    });
  }, []);

  const hasProjects = projects && projects.length > 0;

  /* -------------------------------------------------------------------------- */
  /* UI Layout                                                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-gray-100">
      <main className="flex flex-col px-6 py-8 w-full max-w-6xl mx-auto space-y-8">
        {!hasProjects ? (
          <div className="flex items-center justify-center h-[60vh] text-gray-400 text-lg">
            Create your first project from the left sidebar to get started 🚀
          </div>
        ) : !selectedProjectId ? (
          <div className="flex items-center justify-center h-[60vh] text-gray-400 text-lg">
            Select a project from the left sidebar to continue 📁
          </div>
        ) : (
          <>
            <UsageIndicator />

            {showRecent && (
              <section className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-md border border-white/10 p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">
                  Recent Insights 🔥
                </h2>
                <RecentInsights />
              </section>
            )}

            {showUpgradeBanner && <UpgradeBanner />}

            {/* Keyword Controls */}
            <section className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-md border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-3">
                Keyword Tools
              </h2>

              <KeywordControls
                selectedProject={selectedProjectId}
                onKeywordsUpdate={() => {}}
                onTrendsUpdate={handleTrendsUpdate}
                onKeywordsSaved={handleKeywordsSaved}
              />
            </section>

            {/* ⭐ FULL KEYWORD LIST REPLACES OLD KeywordTable */}
            <section className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-md border border-white/10 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                Keyword Manager
                {refreshing && (
                  <span className="text-xs text-blue-400 animate-pulse">
                    Updating...
                  </span>
                )}
              </h2>

              <KeywordList
  initialKeywords={keywords}
  projectId={selectedProjectId}
  onKeywordChange={(updated) => {
    setKeywords(updated);
    setRefreshing(false);
  }}
  trends={keywordTrends}
  sortByOpportunity={sortByOpportunity}
  onToggleSortOpportunity={() =>
    setSortByOpportunity((s) => !s)
  }
/>
           </section>

            {/* Analytics */}
            <section className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-md border border-white/10 p-6">
              <KeywordAnalytics keywords={keywords} trends={keywordTrends} />
            </section>

            {/* Video Library */}
            <section className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-md border border-white/10 p-6">
              <VideoLibrary key={refreshKey} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
