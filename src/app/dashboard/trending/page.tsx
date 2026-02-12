"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getKeywordRecommendation } from "@/lib/getKeywordRecommendation";
import InsightDrawer from "@/components/dashboard/InsightDrawer";
import LockedFeature from "@/components/shared/LockedFeature";
import { useDashboard } from "@/contexts/DashboardContext";

/* 🚀 Launch override */
const EMAIL_GATE_LAUNCH_MODE = true;

/* ------------------------------- Insight Modal ------------------------------- */
function InsightModal({ open, onClose, title, insight, loading }: any) {
  if (!open) return null;

  const s = insight?.summary || "";
  const why = insight?.why_now || "";
  const tips = insight?.tips || "";
  const conf =
    typeof insight?.confidence === "number"
      ? Math.round(insight.confidence * 100)
      : 60;

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg rounded-xl border border-white/15 bg-[#0d1117] text-gray-100 shadow-2xl"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-semibold text-white">✨ Insight — {title}</h3>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-3 text-sm min-h-[160px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <div className="h-2 w-2/3 bg-white/10 rounded animate-pulse" />
              <div className="h-2 w-1/2 bg-white/10 rounded animate-pulse" />
              <div className="h-2 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="text-xs text-gray-400 mt-3 animate-pulse">
                Generating insight...
              </div>
            </div>
          ) : (
            <>
              {s && (
                <>
                  <div className="text-gray-400 mb-1">Summary</div>
                  <div className="text-gray-200">{s}</div>
                </>
              )}

              {why && (
                <>
                  <div className="text-gray-400 mb-1">Why now?</div>
                  <div className="text-gray-200">{why}</div>
                </>
              )}

              {tips && (
                <>
                  <div className="text-gray-400 mb-1">Creator Tips</div>
                  <div className="text-gray-200">{tips}</div>
                </>
              )}

              {!s && !loading && (
                <div className="text-gray-400 text-center italic">
                  No insight available.
                </div>
              )}

              {!loading && (
                <div className="text-xs text-gray-400">
                  Confidence: {conf}%
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------- Main Page ------------------------------- */
export default function TrendingNowPage() {
  const { selectedProject } = useDashboard();
  const projectId = useMemo(() => {
  if (!selectedProject) return null;

  // If selectedProject is string → already ID
  if (typeof selectedProject === "string") {
    if (
      selectedProject &&
      selectedProject !== "undefined" &&
      selectedProject !== "null"
    ) {
      return selectedProject;
    }
    return null;
  }

  // If selectedProject is object
  const id = selectedProject.id;
  if (
    id &&
    typeof id === "string" &&
    id !== "undefined" &&
    id !== "null" &&
    id.trim() !== ""
  ) {
    return id;
  }

  return null;
}, [selectedProject]);

  const [trends, setTrends] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [showInsightModal, setShowInsightModal] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [insightData, setInsightData] = useState<any>(null);

  const [isProUser, setIsProUser] = useState(false);
  const hasProAccess = isProUser || EMAIL_GATE_LAUNCH_MODE;

  /* --------------------------- Check Plan --------------------------- */
  useEffect(() => {
    async function fetchPlan() {
      try {
        const r = await fetch("/api/user/plan");
        const j = await r.json();
        setIsProUser(j.plan === "pro");
      } catch {
        setIsProUser(false);
      }
    }
    fetchPlan();
  }, []);

  /* --------------------- Compute Opportunity Score --------------------- */
  function getOpportunityScore(row: any): number {
    const v = Math.max(-100, Math.min(100, Number(row.velocity) || 0));
    const views = Number(row.yt_avg_views) || 0;
    const uploads = Number(row.yt_new_uploads) || 0;

    const normalizedViews = Math.min(1, Math.log10(views + 1) / 7);
    const saturation = Math.max(0, 1 - Math.min(uploads / 10, 1));

    const score =
      Math.pow(
        0.5 * (v + 100) / 200 + 0.3 * normalizedViews + 0.2 * saturation,
        0.95
      ) * 100;

    return Math.round(score);
  }

  /* ---------------- Fetch Trends (POST + GET) ---------------- */
  const fetchTrends = useCallback(
    async (silent = false) => {
      if (!projectId) return;

      try {
        if (!silent) setRefreshing(true);

        /* 🔥 1) Refresh metrics in DB */
        await fetch(`/api/keywords/trends`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId }),
        });

        /* 🔥 2) Fetch updated trends */
        const res = await fetch(
          `/api/keywords/trends?project_id=${projectId}`,
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error("Failed to load trends");
        const data = await res.json();
        const arr = Array.isArray(data.trends)
  ? data.trends
  : Object.entries(data.trends || {}).map(([keyword, row]: any) => ({
      keyword, // 🔥 RESTORED
      ...row,
    }));

        const normalized = arr.map((row: any) => ({
          keyword: row.keyword,
          direction: row.direction || row.trend_direction || "stable",
          velocity: Number(row.velocity) || 0,
          trend_7d: Number(row.trend_7d ?? 0),
          trend_30d: Number(row.trend_30d ?? 0),
          yt_avg_views: Number(row.yt_avg_views ?? row.avg_views ?? 0),
          yt_new_uploads: Number(row.yt_new_uploads ?? row.video_count ?? 0),
          opportunity_score:
            Number(row.opportunity_score ?? row.opportunity ?? 0),
          updated_at: row.updated_at || null,
        }));

        setTrends(normalized);
        setLastUpdated(new Date());
        if (!silent) toast.success("✓ Trends updated");
      } catch (err: any) {
        console.error("Trend fetch error:", err);
        if (!silent) toast.error("⚠ Failed to update trends");
        setError(err?.message || String(err));
      } finally {
        if (!silent) setRefreshing(false);
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  /* --------------------------- Trend Icons --------------------------- */
  const getTrendVisuals = (direction: string) =>
    ({
      explosive: { icon: "🔥", color: "text-orange-400" },
      rising: { icon: "🧠", color: "text-emerald-400" },
      stable: { icon: "⚖️", color: "text-gray-400" },
      falling: { icon: "🧊", color: "text-blue-400" },
    }[direction] || { icon: "❓", color: "text-gray-400" });

  /* --------------------------- Filtering --------------------------- */
  const filteredTrends = useMemo(() => {
    const sorted = [...trends].sort(
      (a, b) => (b.velocity || 0) - (a.velocity || 0)
    );
    return filter === "all"
      ? sorted
      : sorted.filter((t) => t.direction === filter);
  }, [trends, filter]);

  /* ----------------------- Top Explosive ----------------------- */
  const topExplosive = useMemo(() => {
    const explosive = trends
      .filter((t) => t.direction === "explosive")
      .sort((a, b) => (b.velocity || 0) - (a.velocity || 0))
      .slice(0, 5);

    return explosive.length
      ? explosive
      : [...trends].sort((a, b) => (b.velocity || 0) - (a.velocity || 0)).slice(0, 5);
  }, [trends]);

  /* --------------------------- UI --------------------------- */
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            🔥 Trending Now
          </h2>
          <p className="text-sm text-gray-400">
            7-day vs 30-day trend momentum for your keywords
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
          {lastUpdated && (
            <div className="text-xs text-gray-400 italic sm:mr-2">
              ⏱ Updated:{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => fetchTrends(false)}
              disabled={refreshing}
              className={`text-sm px-3 py-1.5 rounded-md transition border ${
                refreshing
                  ? "bg-blue-700/30 text-blue-300 border-blue-600/40 cursor-wait"
                  : "bg-blue-600/30 text-blue-200 border-blue-600/50 hover:bg-blue-600/50"
              }`}
            >
              {refreshing ? "🔄 Refreshing..." : "🔁 Refresh"}
            </button>

            <Link
              href="/dashboard"
              className="text-sm px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:bg-white/15"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2">
        {["all", "explosive", "rising", "stable", "falling"].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-sm rounded-md border transition ${
              filter === key
                ? "bg-white/20 border-white/30 text-white"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            {{
              all: "🌎 All",
              explosive: "🔥 Explosive",
              rising: "🧠 Rising",
              stable: "⚖ Stable",
              falling: "🧊 Falling",
            }[key]}
          </button>
        ))}
      </div>

      {/* TOP EXPLOSIVE */}
      {topExplosive.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="sticky top-0 z-10 backdrop-blur-md bg-gradient-to-b from-[#0c0c0c]/80 via-[#0c0c0c]/60 to-transparent p-3 rounded-lg border border-white/10 shadow-md"
        >
          <h3 className="text-sm font-semibold text-orange-400 mb-2">
            🔥 Top 5 Explosive Keywords
          </h3>

          <div className="flex flex-wrap gap-2">
            {topExplosive.map((row, i) => (
              <motion.span
                key={row.keyword}
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="text-xs px-3 py-1 rounded-md border font-semibold tracking-wide"
              >
                {i + 1}. {row.keyword} ({(row.velocity || 0).toFixed(1)}%)
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* TREND LIST */}
      {loading ? (
        <div className="text-gray-400">Fetching trends...</div>
      ) : error ? (
        <div className="text-red-400">⚠ {error}</div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="divide-y divide-white/10"
          >
            {filteredTrends.map((row: any) => {
              const { icon, color } = getTrendVisuals(row.direction);
              const opportunityScore = getOpportunityScore(row);

              const difficultyApprox = Math.max(
                1,
                Math.min(
                  99,
                  Math.round(
                    Number(row.yt_new_uploads || 0) * 2 +
                      Number(row.yt_avg_views || 0) / 100000
                  )
                )
              );

              return (
                <motion.div
                  key={row.keyword}
                  className="py-3 flex items-center justify-between group relative"
                >
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate flex items-center gap-2">
                      <span className={`${color} text-lg`}>{icon}</span>
                      {row.keyword}
                    </div>
                    <div className="text-xs text-gray-400">
                      7d: {row.trend_7d} · 30d: {row.trend_30d} · Views:{" "}
                      {Number(row.yt_avg_views).toLocaleString()} · New:{" "}
                      {row.yt_new_uploads}
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 italic border-l border-white/10 pl-2">
                    {getKeywordRecommendation({
                      velocity: row.velocity,
                      opportunity: opportunityScore,
                      difficulty: difficultyApprox,
                      isProUser,
                    })}
                  </div>

                  <div className="flex items-end gap-6">
                    <div className="text-right text-sm text-white font-semibold min-w-[72px]">
                      {row.velocity >= 0 ? "▲" : "▼"}{" "}
                      {row.velocity.toFixed(1)}%
                    </div>

                    <div className="flex items-end gap-6">
                      <LockedFeature isLocked={!hasProAccess}>
                        <div className="text-xs font-semibold px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/40 text-amber-300">
                          💰{" "}
                          {opportunityScore}                            
                            
                          /100
                        </div>
                      </LockedFeature>

                      <LockedFeature isLocked={!hasProAccess}>
                        <div className="text-xs font-semibold px-2 py-1 rounded bg-white/10 border border-white/20 text-blue-200">
                          🧭 ~ {difficultyApprox}
                        </div>
                      </LockedFeature>
                    </div>

                    <InsightDrawer
                      keyword={row.keyword}
                      isProUser={hasProAccess}
                      data={{
                        velocity: row.velocity,
                        opportunityScore,
                        difficultyApprox,
                        trend7d: row.trend_7d,
                        trend30d: row.trend_30d,
                        yt_avg_views: row.yt_avg_views,
                        yt_new_uploads: row.yt_new_uploads,
                        recommendation: getKeywordRecommendation({
                          velocity: row.velocity,
                          opportunity: opportunityScore,
                          difficulty: difficultyApprox,
                          isProUser,
                        }),
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      <InsightModal
        open={showInsightModal}
        onClose={() => setShowInsightModal(false)}
        title={selectedKeyword}
        insight={insightData}
        loading={false}
      />
    </div>
  );
}
