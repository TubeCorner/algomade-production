"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function ToolsDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* 🔹 Dropdown Trigger */}
      <button className="flex items-center gap-1 text-gray-300 hover:text-white text-sm transition">
        AI Tools
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {/* 🔹 Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-3 w-[700px] bg-[#0F172A] border border-white/10 rounded-xl shadow-lg p-6 grid grid-cols-3 gap-6 z-50">
          {/* Column 1 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">
              Grow Your Channel
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition">AI Title Generator</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Keywords Generator</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">YouTube Tag Generator</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">YouTube Video Ideas</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Channel Name Generator</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">
              Create Content
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition">AI Content Generator</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">AI Description Generator</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Video Script Generator</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">
              Design Thumbnails
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-blue-400 transition">AI Thumbnail Maker</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Thumbnail Downloader</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Thumbnail Resizer</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Thumbnail Templates</Link></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
