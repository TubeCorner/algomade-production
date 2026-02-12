"use client";
import { Button } from "@/components/ui/button";

type Props = {
  keyword: string;
  onTitlesDesc: (kw: string) => void;
  onThumbnailIdea?: (kw: string) => void;   // placeholder
  onClusterPro?: (kw: string) => void;      // placeholder
  onClose: () => void;
};

export default function KeywordActionsMenu({
  keyword, onTitlesDesc, onThumbnailIdea, onClusterPro, onClose
}: Props) {
  return (
    <div className="bg-[#1E293B] border border-white/10 p-5 rounded-xl w-[350px] space-y-3 shadow-lg">
      <h3 className="text-white font-semibold text-lg mb-2">
        Actions for “{keyword}”
      </h3>
      <Button
        className="w-full bg-gradient-to-r from-pink-500 to-violet-600 text-white"
        onClick={() => onTitlesDesc(keyword)}
      >
        📝 AI Titles & Descriptions
      </Button>
      <Button
        className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white"
        onClick={() => onThumbnailIdea?.(keyword)}
      >
        🎨 AI Thumbnail Idea
      </Button>
      <Button
        className="w-full bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white"
        onClick={() => onClusterPro?.(keyword)}
      >
        💎 Keyword Cluster Pro
      </Button>
      <Button
        variant="outline"
        className="w-full text-gray-300 border-gray-600 hover:bg-gray-700"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );
}
