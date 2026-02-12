"use client";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import KeywordActionsMenu from "./KeywordActionsMenu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type SavedKeyword = {
  id: string;
  keyword: string;
  trend?: "rising" | "falling" | "stable" | null;
  // Add any other fields you already fetch (project_id, source, created_at, etc.)
};

type Props = {
  item: SavedKeyword;
  onTitlesDesc: (kw: string) => Promise<void>; // delegate up so the parent owns AI call
  // You can add delete/edit later
};

export default function SavedKeywordItem({ item, onTitlesDesc }: Props) {
  const [open, setOpen] = useState(false);

  const badge =
    item.trend === "rising" ? "📈" :
    item.trend === "falling" ? "📉" :
    item.trend === "stable" ? "⚖" : "";

  return (
    <div className="px-3 py-2 rounded-md border text-sm flex items-center justify-between bg-white/5 border-white/10 hover:bg-white/10">
      <div className="flex items-center gap-2">
        <span className="truncate">{item.keyword}</span>
      </div>

      <div className="flex items-center gap-2">
        {badge && <span className="text-xs text-gray-300">{badge}</span>}
        <button
          onClick={() => setOpen(true)}
          className="p-1 hover:bg-white/10 rounded-md"
          aria-label="Keyword actions"
          title="Keyword actions"
        >
          <MoreHorizontal size={16} className="text-gray-400" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <KeywordActionsMenu
            keyword={item.keyword}
            onTitlesDesc={async (kw) => {
              try { await onTitlesDesc(kw); }
              catch { toast.error("Failed to generate metadata"); }
              finally { setOpen(false); }
            }}
            onThumbnailIdea={() => toast("🎨 Coming soon")}
            onClusterPro={() => toast("💎 Coming soon")}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
