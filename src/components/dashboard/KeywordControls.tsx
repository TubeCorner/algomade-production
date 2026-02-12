"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeywordControlsProps {
  selectedProject: string | { id: string };
  onKeywordsUpdate: (keywords: any[]) => void;
  onTrendsUpdate: (trends: Record<string, string>) => void;
  onKeywordsSaved?: () => void;
}

export default function KeywordControls({
  selectedProject,
  onKeywordsUpdate,
  onTrendsUpdate,
  onKeywordsSaved = () => {},
}: KeywordControlsProps) {
  const [topic, setTopic] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [trendData, setTrendData] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingYT, setLoadingYT] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extended, setExtended] = useState(false);
  const [lastSource, setLastSource] = useState<"ai" | "youtube" | null>(null);

  const projectId =
    typeof selectedProject === "string"
      ? selectedProject
      : selectedProject?.id;

  /* -------------------------------------------
     Merge API Trend Directions
  ------------------------------------------- */
  const mergeTrends = (incoming: any) => {
    const result: Record<string, string> = {};

    Object.entries(incoming || {}).forEach(([k, v]: any) => {
      result[k.toLowerCase()] =
        typeof v === "string" ? v : v?.direction || "stable";
    });

    return result;
  };

  /* -------------------------------------------
     AI Keyword Generator
  ------------------------------------------- */
  const handleGenerateAI = async () => {
    if (!topic.trim()) return toast.error("Enter a topic first");
    if (!projectId) return toast.error("Select a project first");

    setLoadingAI(true);

    try {
      const res = await fetch("/api/keywords/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const json = await res.json();
      if (!res.ok || !json.keywords) throw new Error(json.error || "Failed");

      const kws = json.keywords;
      setGenerated(kws);
      setSelected([]);
      setLastSource("ai");

      onKeywordsUpdate(
        kws.map((kw) => ({
          id: crypto.randomUUID(),
          keyword: kw,
          source: "ai",
          created_at: new Date().toISOString(),
        }))
      );

      /* Fetch YT Trend Data */
      const trendRes = await fetch("/api/keywords/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: kws,
          project_id: projectId,
        }),
      });

      const trendJson = await trendRes.json();
      const merged = mergeTrends(trendJson.trends || {});
      setTrendData(merged);
      onTrendsUpdate(merged);

      toast.success(`🧠 ${kws.length} AI keywords generated`);
    } catch (err) {
      console.error(err);
      toast.error("AI keyword generation failed");
    } finally {
      setLoadingAI(false);
    }
  };

  /* -------------------------------------------
     YouTube Keyword Scraper
  ------------------------------------------- */
  const handleGenerateYT = async () => {
  if (!topic.trim()) return toast.error("Enter a topic first");
  if (!projectId) return toast.error("Select a project first");

  setLoadingYT(true);

  try {
    const res = await fetch("/api/keywords/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: topic, extended }),
    });

    let json: any = {};
    try {
      json = await res.json();
    } catch {
      throw new Error("Invalid response from YouTube keyword API");
    }

    if (!res.ok) {
      throw new Error(json?.error || "YouTube keyword fetch failed");
    }

    if (!Array.isArray(json.keywords)) {
      throw new Error("No keywords returned");
    }

    const kws = json.keywords;

    setGenerated(kws);
    setSelected([]);
    setLastSource("youtube");

    onKeywordsUpdate(
      kws.map((kw) => ({
        id: crypto.randomUUID(),
        keyword: kw,
        source: "youtube",
        created_at: new Date().toISOString(),
      }))
    );

    /* Fetch Trends */
    const trendRes = await fetch("/api/keywords/trends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: kws, project_id: projectId }),
    });

    const trendJson = await trendRes.json().catch(() => ({}));
    const merged = mergeTrends(trendJson.trends || {});
    setTrendData(merged);
    onTrendsUpdate(merged);

    toast.success(`📈 ${kws.length} YouTube keywords found`);
  } catch (err: any) {
    console.error("YT keyword error:", err);
    toast.error(err.message || "YouTube keyword fetch failed");
  } finally {
    setLoadingYT(false);
  }
};

  /* -------------------------------------------
     Save Selected Keywords (🔥 patched)
  ------------------------------------------- */
  const handleSaveSelected = async () => {
    if (!selected.length) return toast.error("No keywords selected");
    if (!projectId) return toast.error("No project selected");

    setSaving(true);

    try {
      const res = await fetch("/api/save-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          keywords: selected,
          source: lastSource || "manual",

          /* 🔥 FIX: MUST SEND THIS TO AVOID SUPABASE ERROR */
          insightPayload: {},

          /* Prepare for future metrics support */
          metrics: {},
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");

      toast.success(`✅ Saved ${selected.length} keywords`);

      onKeywordsSaved();

      setSelected([]);
      setGenerated([]);
      setTrendData({});
      setTopic("");
    } catch (err) {
      console.error(err);
      toast.error("Saving failed");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------
     UI
  ------------------------------------------- */
  return (
    <div className="border border-white/10 p-5 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg space-y-5 text-white">
      {/* INPUT + BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Enter topic or video title"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
        />

        <div className="flex gap-2">
          <button
            onClick={handleGenerateAI}
            disabled={loadingAI}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-500/50"
          >
            {loadingAI ? "Generating..." : "✨ AI Keywords"}
          </button>

          <button
            onClick={handleGenerateYT}
            disabled={loadingYT}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-500/50"
          >
            {loadingYT ? "Fetching..." : "📈 YouTube Keywords"}
          </button>
        </div>
      </div>

      {/* MODE TOGGLE */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-300 ml-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!extended}
            onChange={() => setExtended(false)}
            className="accent-blue-500"
          />
          Fast mode (10 YouTube Keywords)
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={extended}
            onChange={() => setExtended(true)}
            className="accent-blue-500"
          />
          Extended mode (40 YouTube Keywords)
        </label>
      </div>

      {/* GENERATED KEYWORDS */}
      {generated.length > 0 && (
        <div className="border border-white/10 rounded-xl p-4 bg-white/5">
          <h3 className="font-semibold text-gray-200 mb-3">
            Select keywords ({selected.length}/{generated.length})
          </h3>

          <div className="flex flex-wrap gap-2">
            {generated.map((kw) => {
              const isSelected = selected.includes(kw);
              const trend = trendData[kw.toLowerCase()];

              return (
                <button
                  key={kw}
                  onClick={() =>
                    setSelected((prev) =>
                      isSelected ? prev.filter((x) => x !== kw) : [...prev, kw]
                    )
                  }
                  className={`px-3 py-1 rounded-lg text-sm border flex items-center gap-1 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white/10 text-gray-200 border-white/10"
                  }`}
                >
                  {kw}

                  {trend === "rising" && <span className="text-green-400 text-xs">📈</span>}
                  {trend === "falling" && <span className="text-red-400 text-xs">📉</span>}
                  {trend === "stable" && <span className="text-gray-400 text-xs">⚖</span>}
                  {!trend && <span className="text-yellow-400 text-xs">⏳</span>}

                  {isSelected && <Check size={14} className="ml-1" />}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <button
              onClick={handleSaveSelected}
              disabled={saving || !selected.length}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-500/50"
            >
              {saving ? "Saving..." : `Save Selected (${selected.length})`}
            </button>
          </div>
        </div>
      )}

      {/* PRO BUTTONS */}
      <div className="flex flex-wrap gap-2 mt-3">
        <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
          ✨ AI Keyword Generator Pro
        </Button>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          🎨 AI Thumbnail Ideas
        </Button>
      </div>
    </div>
  );
}
