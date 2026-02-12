"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

/**
 * Props expected:
 * - keyword: string
 * - aiLoading: string | null
 * - setAiLoading: (kw: string | null) => void
 * - increment: () => void
 * - reached: boolean
 * - setAiResults: (fn) => void
 * - setVideoPacks: (fn) => void
 * - setExpandedPackFor: (kw: string) => void
 */
export default function KeywordActionsMenu({
  keyword,
  aiLoading,
  setAiLoading,
  increment,
  reached,
  setAiResults,
  setVideoPacks,
  setExpandedPackFor,
}: any) {
  /* -----------------------------------------------------------
     Helpers
  ----------------------------------------------------------- */
  const closeMenu = () => {
    // Force Radix menu close (important for async actions)
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape" })
    );
  };

  /* -----------------------------------------------------------
     Generate AI Titles & Descriptions
  ----------------------------------------------------------- */
  const generateMeta = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (reached) {
      toast("Upgrade required");
      return;
    }

    closeMenu();

    try {
      setAiLoading(keyword);
      increment?.();

      const res = await fetch("/api/ai/generate-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: [keyword] }),
      });

      const raw = await res.text();
      let json: any = {};

      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        json = {};
      }

      const payload = json?.data ?? json ?? {};
      const titles = Array.isArray(payload.titles)
        ? payload.titles.map(String)
        : [];
      const descriptions = Array.isArray(payload.descriptions)
        ? payload.descriptions.map(String)
        : [];

      setAiResults((prev: any) => ({
        ...prev,
        [keyword]: { titles, descriptions },
      }));

      toast.success("AI Metadata Ready");
    } catch (err) {
      console.error("Meta generation failed:", err);
      toast.error("Failed to generate metadata");
    } finally {
      setAiLoading(null);
    }
  };

  /* -----------------------------------------------------------
     Generate Video Idea Pack
  ----------------------------------------------------------- */
  const generatePack = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    closeMenu();

    try {
      setAiLoading(keyword);

      const res = await fetch("/api/ai/generate-video-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      const raw = await res.text();
      let json: any = {};

      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        json = {};
      }

      const pack = json?.pack ?? {};

      setVideoPacks((prev: any) => ({
        ...prev,
        [keyword]: pack,
      }));

      setExpandedPackFor?.(keyword);
      toast.success("Video Pack Ready");
    } catch (err) {
      console.error("Pack generation failed:", err);
      toast.error("Failed to generate video pack");
    } finally {
      setAiLoading(null);
    }
  };

  /* -----------------------------------------------------------
     Render
  ----------------------------------------------------------- */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1 rounded hover:bg-white/10 transition"
          onClick={(e) => e.stopPropagation()}
          aria-label="Keyword actions"
        >
          <MoreHorizontal size={16} className="text-gray-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 z-50 bg-[#0F172A] border border-white/10 text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel className="truncate text-gray-400">
          {keyword}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem
          onClick={generateMeta}
          disabled={aiLoading === keyword}
          className="cursor-pointer"
        >
          {aiLoading === keyword ? "⏳ Generating..." : "📝 AI Titles & Descriptions"}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={generatePack}
          disabled={aiLoading === keyword}
          className="cursor-pointer"
        >
          {aiLoading === keyword ? "⏳ Generating..." : "🎬 Video Idea Pack"}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            closeMenu();
            toast("Coming soon");
          }}
          className="cursor-pointer"
        >
          🎨 Thumbnail Ideas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
