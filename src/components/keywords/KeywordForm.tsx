"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";

/* -------------------------------------------------------------------------- */
/* 🎯 Component Props                                                          */
/* -------------------------------------------------------------------------- */
interface KeywordFormProps {
  projectId: string;
  onKeywordsSaved?: (keywords: string[], source: string) => void;
}

export default function KeywordForm({ projectId, onKeywordsSaved }: KeywordFormProps) {
  /* -------------------------------------------------------------------------- */
  /* 🔧 States                                                                  */
  /* -------------------------------------------------------------------------- */
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [lastMode, setLastMode] = useState<"ai" | "youtube">("youtube");
  const [trends, setTrends] = useState<{ [keyword: string]: string }>({});
  const [fetchingTrends, setFetchingTrends] = useState(false);
  const { plan, isPro, loading: planLoading } = usePlan();

  // ✨ For AI Meta Generator
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [meta, setMeta] = useState<{ titles: string[]; descriptions: string[] } | null>(null);

  // 🧩 New: Contextual Actions
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
/* 🧠 Generate Keywords (AI or YouTube)                                       */
/* -------------------------------------------------------------------------- */
const handleGenerate = useCallback(
  async (mode: "ai" | "youtube") => {
    if (!topic.trim()) return toast.error("Please enter a topic first!");
    if (!projectId) return toast.error("Select a project first!");

    setLoading(true);
    setLastMode(mode);

    try {
      // ✅ Check daily limit for Free users (before hitting expensive APIs)
      const limitRes = await fetch("/api/keywords/check-limit", { method: "POST" });
      const limitData = await limitRes.json();

      if (!limitData.allowed) {
        toast.error(
          limitData.reason === "unauthorized"
            ? "Please sign in to generate keywords."
            : `⚠️ Daily limit reached (${limitData.limit}/day). Upgrade to Pro for unlimited keywords.`
        );
        setLoading(false);
        return;
      }

      // 🧭 Continue with generation if allowed
      const endpoint =
        mode === "ai"
          ? "/api/ai/generate-keywords"
          : "/api/keywords/generate-youtube";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const keywords = Array.isArray(data.keywords)
        ? data.keywords.map((k: string) => k.trim()).filter(Boolean)
        : [];

      if (keywords.length === 0) throw new Error("No keywords generated");

      // ✅ Show immediately for selection
      setGenerated(keywords);
      setSelected(new Set());
      toast.success(`✅ ${keywords.length} ${mode} keywords generated!`);

      // 🔍 Fetch trend data after generation
      try {
        setFetchingTrends(true);
        const trendRes = await fetch("/api/keywords/trends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords }),
        });

        if (trendRes.ok) {
          const trendData = await trendRes.json();
          setTrends(trendData.trends || {});
        }
      } catch (err) {
        console.warn("Trend fetch error:", err);
      } finally {
        setTimeout(() => setFetchingTrends(false), 1200);
      }
    } catch (err) {
      console.error("❌ Generation error:", err);
      toast.error("Keyword generation failed");
    } finally {
      setLoading(false);
    }
  },
  [topic, projectId]
);

  /* -------------------------------------------------------------------------- */
  /* 💾 Save Selected Keywords (with auto-refresh trigger)                      */
/* -------------------------------------------------------------------------- */
const handleSaveSelected = useCallback(async () => {
  if (selected.size === 0)
    return toast.error("Please select at least one keyword!");

  setSaving(true);
  const keywords = Array.from(selected);
  const source = lastMode;

  try {
    const res = await fetch("/api/save-keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, keywords, source }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Save failed");

    toast.success(`✅ ${keywords.length} ${source} keywords saved!`);

    // ✅ 🔁 Notify parent dashboard to refresh Video Library
    if (onKeywordsSaved) {
      onKeywordsSaved(keywords, source);
    }

      // Reset UI state
      setSelected(new Set());
      setGenerated([]);
      setTopic("");
      setTrends({});
    } catch (err) {
      console.error("❌ Save error:", err);
      toast.error("Unable to save keywords");
    } finally {
      setSaving(false);
    }
  }, [selected, projectId, lastMode, onKeywordsSaved]);

  /* -------------------------------------------------------------------------- */
  /* 🧠 AI Titles & Descriptions (Per Keyword or Multi)                         */
  /* -------------------------------------------------------------------------- */
  const handleGenerateMetaForKeyword = async (keyword: string) => {
    setShowActions(false);
    setLoadingMeta(true);
    try {
      const res = await fetch("/api/ai/generate-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: [keyword] }),
      });
      const data = await res.json();
      if (res.ok) {
        setMeta(data);
        toast.success(`🎬 AI Titles & Descriptions for "${keyword}"`);
      } else {
        toast.error(data.error || "Failed to generate metadata");
      }
    } catch (err) {
      console.error("Meta generation error:", err);
      toast.error("Something went wrong while generating metadata");
    } finally {
      setLoadingMeta(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🧩 Utility: Reset Input                                                    */
  /* -------------------------------------------------------------------------- */
  const handleReset = () => {
    setTopic("");
    setGenerated([]);
    setSelected(new Set());
    setTrends({});
    setMeta(null);
    toast("Input reset");
  };

  const toggleKeyword = (kw: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      return next;
    });
  };

  /* -------------------------------------------------------------------------- */
  /* 🧭 UI Layout                                                               */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="space-y-4 bg-[#0F172A]/60 border border-white/10 rounded-2xl p-5">
      {/* Header */}
      <h3 className="text-md font-semibold text-white mb-2">Keyword Input</h3>

      {/* Topic Input */}
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Describe your topic (e.g. best SEO tools for 2025)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 text-gray-100 placeholder-gray-400"
        />
        <Button
          variant="secondary"
          onClick={handleReset}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          Reset
        </Button>
      </div>

      {/* Action Buttons (Plan-aware) */}
<div className="flex flex-wrap justify-center gap-2 mt-4">
  <Button
    onClick={() => {
      if (!isPro) {
        toast.error("🚀 Upgrade to Pro to unlock AI Keyword Generator!");
        return;
      }
      handleGenerate("ai");
    }}
    disabled={loading || planLoading}
    className={`${
      isPro
        ? "bg-gradient-to-r from-purple-600 to-pink-600"
        : "bg-gray-700 cursor-not-allowed opacity-70"
    } text-white font-medium`}
  >
    ✨ AI Keywords
  </Button>

  <Button
    onClick={() => handleGenerate("youtube")}
    disabled={loading || planLoading}
    className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
  >
    📈 YouTube Keywords
  </Button>
</div>

      {/* Rest of your code — unchanged */}
      {/* Generated list, trend badges, context menu, AI meta, etc. */}
    </div>
  );
}
