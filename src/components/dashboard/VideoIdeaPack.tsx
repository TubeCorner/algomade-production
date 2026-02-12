"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useDashboard } from "@/contexts/DashboardContext";

interface VideoIdeaPackProps {
  idea: {
    keyword: string;
    title: string;
    hook: string;
    description: string;
    cta: string;
  };
}

/**
 * 🎬 VideoIdeaPack component
 * Displays a generated idea with option to save it to Supabase (video_ideas table)
 */
export default function VideoIdeaPack({ idea }: VideoIdeaPackProps) {
  const { selectedProject } = useDashboard();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false); // ✅ NEW: Track saved state

  if (!idea) return null;

  async function handleSaveIdea() {
    if (!selectedProject?.id) {
      toast.error("Please select a project before saving");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/ai/save-video-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: idea.keyword || "untitled",
          project_id: selectedProject.id,
          title: idea.title || "",
          hook: idea.hook || "",
          description: idea.description || "",
          cta: idea.cta || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save idea");

      toast.success("💾 Video idea saved to library!");
      setSaved(true); // ✅ mark as saved
    } catch (err: any) {
      console.error("❌ Save failed:", err);
      toast.error(err.message || "Failed to save video idea");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-lg space-y-3 transition-all duration-300">
      <h3 className="text-lg font-semibold text-white">{idea.title}</h3>
      <p className="text-sm text-gray-300 italic">🎯 {idea.hook}</p>
      <p className="text-sm text-gray-400">{idea.description}</p>
      <p className="text-sm text-blue-400">👉 {idea.cta}</p>

      <div className="flex justify-end">
        {saved ? (
          <button
            disabled
            className="mt-3 text-sm px-4 py-2 rounded-md bg-green-700 text-white cursor-not-allowed transition"
          >
            ✅ Saved
          </button>
        ) : (
          <button
            onClick={handleSaveIdea}
            disabled={saving}
            className={`mt-3 text-sm px-4 py-2 rounded-md text-white transition ${
              saving
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {saving ? "Saving..." : "💾 Save to Library"}
          </button>
        )}
      </div>
    </div>
  );
}
