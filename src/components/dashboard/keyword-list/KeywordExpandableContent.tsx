"use client";

import React from "react";
import toast from "react-hot-toast";
import VideoIdeaPack from "@/components/dashboard/VideoIdeaPack";

export default function KeywordExpandableContent({
  keyword,
  aiLoading,
  meta,
  pack,
}: {
  keyword: string;
  aiLoading: string | null;
  meta?: { titles?: string[]; descriptions?: string[] };
  pack?: any;
}) {
  const titles = meta?.titles ?? [];
  const descriptions = meta?.descriptions ?? [];

  return (
    <div className="space-y-4">
      {/* Loading */}
      {aiLoading === keyword && (
        <div className="animate-pulse text-gray-400 text-xs">
          Generating…
        </div>
      )}

      {/* Titles & Descriptions */}
      {(titles.length > 0 || descriptions.length > 0) && (
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">
              AI Titles & Descriptions — “{keyword}”
            </h3>

            <button
              onClick={() => {
                const txt = [
                  "Titles:",
                  ...titles,
                  "",
                  "Descriptions:",
                  ...descriptions,
                ].join("\n");

                navigator.clipboard
                  .writeText(txt)
                  .then(() => toast.success("Copied!"));
              }}
              className="text-xs bg-white/10 px-2 py-1 rounded text-white"
            >
              Copy
            </button>
          </div>

          <ul className="mt-2 text-gray-300 space-y-1">
            {titles.length ? (
              titles.map((t, i) => <li key={i}>{t}</li>)
            ) : (
              <li className="text-gray-400 italic">No titles.</li>
            )}
          </ul>

          <div className="mt-4 text-gray-300 space-y-1">
            {descriptions.length ? (
              descriptions.map((d, i) => <p key={i}>{d}</p>)
            ) : (
              <p className="text-gray-400 italic">No descriptions.</p>
            )}
          </div>
        </div>
      )}

      {/* Video Idea Pack */}
      {pack && (
        <VideoIdeaPack
          idea={{
            keyword,
            title: pack.titles?.[0] || "",
            hook: pack.hook || "",
            description: pack.description || "",
            cta: pack.cta || "",
          }}
        />
      )}
    </div>
  );
}
