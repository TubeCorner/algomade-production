"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { motion } from "framer-motion";

/* 🚀 Launch override */
const EMAIL_GATE_LAUNCH_MODE = true;

export default function InsightDrawer({
  keyword,
  data,
  isProUser,
}: {
  keyword: string;
  data: any;
  isProUser: boolean;
}) {
  const hasProAccess = isProUser || EMAIL_GATE_LAUNCH_MODE;

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");

  const [loadingAI, setLoadingAI] = useState(false);
  const [insight, setInsight] = useState<any>(null);

  const [loadingRank, setLoadingRank] = useState(false);
  const [rankData, setRankData] = useState<any>(null);

  /* ---------------------------------------------------------------------- */
  /* 1️⃣ AI Insight Loader                                                  */
  /* ---------------------------------------------------------------------- */
  async function loadAIInsight() {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/keywords/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          metrics: {
            velocity: data.velocity,
            trend7d: data.trend7d,
            trend30d: data.trend30d,
            yt_avg_views: data.yt_avg_views,
            yt_new_uploads: data.yt_new_uploads,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setRankData(null);
        return;
      }

      setInsight(json.insight || json);
    } catch (err) {
      console.error("AI insight error:", err);
      setInsight({
        summary: "Could not generate insight at this moment.",
        why_now: "Try again soon.",
        tips: "Ensure OpenAI key & backend availability.",
        confidence: 0.6,
      });
    } finally {
      setLoadingAI(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* 2️⃣ Rank Insight Loader (Pro Only)                                     */
  /* ---------------------------------------------------------------------- */
  async function loadRankInsight() {
    if (!hasProAccess) return;

    setLoadingRank(true);
    try {
      const res = await fetch("/api/keywords/rank-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.warn("YouTube insight unavailable", json);
        setRankData(null);
        return;
      }

      setRankData(json);
    } catch (err) {
      console.error("Rank insight error:", err);
      setRankData(null);
    } finally {
      setLoadingRank(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Auto-load insights when drawer opens                                   */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (open) {
      loadAIInsight();
      loadRankInsight();
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="text-xs px-2 py-1 rounded border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setOpen(true)}
        >
          ✨ Insight
        </button>
      </SheetTrigger>

      <SheetContent className="bg-[#0b0f19] text-white border-l border-white/10 w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold text-amber-400">
            Insight — {keyword}
          </SheetTitle>
          <SheetDescription className="text-gray-400 text-sm">
            Data-backed breakdown from AlgoMade AI
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 space-y-4">
          <TabsList className="grid grid-cols-2 w-full bg-white/5 border border-white/10">
            <TabsTrigger
              value="ai"
              className="text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
            >
              🤖 AI Insight
            </TabsTrigger>

            <TabsTrigger
              value="rank"
              className="text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
            >
              📊 Rank Insight
            </TabsTrigger>
          </TabsList>

          {/* 🧠 AI INSIGHT TAB */}
          <TabsContent value="ai">
            {loadingAI ? (
              <div className="text-gray-400 text-center py-6 animate-pulse">
                🧠 Generating insights...
              </div>
            ) : insight ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard title="Velocity" value={`${data.velocity.toFixed(1)}%`} color="text-blue-300" />
                  <MetricCard title="Opportunity" value={`${data.opportunityScore}/100`} color="text-amber-300" />
                  <MetricCard title="Difficulty" value={`${data.difficultyApprox}`} color="text-rose-300" span />
                </div>

                <InsightBlock label="Summary" text={insight.summary} />
                <InsightBlock label="Why Now?" text={insight.why_now} />

                <div>
                  <h3 className="text-xs text-gray-400 uppercase mb-1">Creator Tips</h3>
                  <p className={`text-sm text-gray-200 ${!hasProAccess ? "blur-[2px] select-none" : ""}`}>
                    {insight.tips}
                  </p>
                  {!hasProAccess && (
                    <p className="text-[10px] text-gray-500 mt-1 italic">
                      🔒 Unlock full creator tips with AlgoMade Pro
                    </p>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Confidence</span>
                    <span>{((insight.confidence ?? 0.6) * 100).toFixed(0)}%</span>
                  </div>

                  <div className="h-1.5 bg-white/10 rounded">
                    <div
                      className="h-1.5 bg-amber-400 rounded transition-all"
                      style={{ width: `${(insight.confidence ?? 0.6) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={loadAIInsight}
                    className="text-xs px-3 py-1 rounded border border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    🔁 Regenerate
                  </button>

                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `Keyword: ${keyword}\n\n${insight.summary}\n\nTips: ${insight.tips}`
                      )
                    }
                    className="text-xs px-3 py-1 rounded border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20"
                  >
                    📋 Copy Insight
                  </button>
                </div>

                {!hasProAccess && <ProUpgradeNotice keyword={keyword} />}
              </motion.div>
            ) : (
              <div className="text-gray-400 text-center py-6">No insight available.</div>
            )}
          </TabsContent>

          {/* 📊 RANK INSIGHT TAB */}
          <TabsContent value="rank">
            {!hasProAccess ? (
              <div className="text-center text-gray-400 py-10 text-sm">
                🔒 <b>Rank Insights</b> are available for <span className="text-blue-300">Pro users</span>.
              </div>
            ) : loadingRank ? (
              <div className="text-gray-400 text-center py-6 animate-pulse">
                📈 Fetching rank insights...
              </div>
            ) : rankData ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    title="Difficulty"
                    value={`${rankData.difficulty_score}/100`}
                    color={
                      rankData.difficulty_score > 80
                        ? "text-red-400"
                        : rankData.difficulty_score > 50
                        ? "text-yellow-400"
                        : "text-green-400"
                    }
                  />
                  <MetricCard title="Channels" value={`${rankData.channel_count}`} color="text-gray-300" />
                  <MetricCard title="Avg Subs" value={rankData.avg_subs?.toLocaleString() || "N/A"} color="text-purple-300" />
                  <MetricCard title="Avg Views" value={rankData.avg_views?.toLocaleString() || "N/A"} color="text-blue-300" />
                </div>

                <div className="border border-white/10 rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                  <h3 className="text-xs text-gray-400 uppercase mb-2">Recommended Action</h3>
                  <p className="text-sm text-gray-100 leading-relaxed">
                    {rankData.recommended_action || "No recommendation available."}
                  </p>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rankData.cached ? "bg-yellow-400" : "bg-green-400"
                      } animate-pulse`}
                    ></span>
                    {rankData.cached ? "Cached (24h)" : "Live YouTube data"}
                  </span>
                </p>
              </motion.div>
            ) : (
              <div className="text-gray-400 text-center py-6">No rank data.</div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <button className="w-full py-2 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-sm">
              Close
            </button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ---------------------------------------------------------------------- */
/* Small Components                                                       */
/* ---------------------------------------------------------------------- */

function MetricCard({
  title,
  value,
  color,
  span = false,
}: {
  title: string;
  value: string;
  color: string;
  span?: boolean;
}) {
  return (
    <div
      className={`border border-white/10 rounded-lg p-3 bg-white/5 ${
        span ? "col-span-2" : ""
      }`}
    >
      <h3 className="text-xs text-gray-400 uppercase mb-1">{title}</h3>
      <p className={`text-sm font-medium ${color}`}>{value}</p>
    </div>
  );
}

function InsightBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <h3 className="text-xs text-gray-400 uppercase mb-1">{label}</h3>
      <p className="text-sm text-gray-200">{text}</p>
    </div>
  );
}

function ProUpgradeNotice({ keyword }: { keyword: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border border-amber-400/30 bg-amber-500/10 rounded-lg p-4 mt-4"
    >
      <div className="text-sm font-semibold text-amber-300 text-center">
        🔒 Pro Insights Locked
      </div>
      <p className="text-xs text-gray-300 text-center mt-1">
        Unlock full ranking analytics & audience insights for “{keyword}”.
      </p>

      <a
        href="/pricing"
        className="block text-center mt-2 text-xs px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200"
      >
        🚀 Upgrade to AlgoMade Pro
      </a>
    </motion.div>
  );
}
