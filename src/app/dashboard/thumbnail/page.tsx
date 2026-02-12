"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button"; // adapt if your Button path differs
import { useRouter } from "next/navigation";

type StyleKey = "ctr" | "minimal" | "bold";

export default function ThumbnailStudioPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("/mockup-dashboard.png"); // default, replace with sample path below
  const [style, setStyle] = useState<StyleKey>("ctr");
  const [textOverlay, setTextOverlay] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Replace with the uploaded file path for immediate local preview during dev:
  // Preview sample image (local path) -> /mnt/data/A_2D_digital_image_displays_a_dashboard_interface_.png
  // In production change to "/mockup-dashboard.png" in public or Supabase URL.
  React.useEffect(() => {
    // only set sample when nothing uploaded
    if (!file && previewUrl === "/mockup-dashboard.png") {
      setPreviewUrl("/mnt/data/A_2D_digital_image_displays_a_dashboard_interface_.png");
    }
  }, [file]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setFile(f);
    setGenerated([]);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const onClickUpload = () => inputRef.current?.click();

  async function generateThumbnails() {
    if (!previewUrl && !file) return alert("Please upload an image first.");
    setLoading(true);
    setGenerated([]);

    try {
      // Build form payload - we support both file upload or URL
      const form = new FormData();
      if (file) form.append("file", file);
      else form.append("imageUrl", previewUrl);
      form.append("style", style);
      form.append("text", textOverlay || "");

      const res = await fetch("/api/thumbnail/generate", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
      }

      const json = await res.json();
      // Expect json.images => array of data-urls or URLs
      setGenerated(json.images || []);
    } catch (err: any) {
      console.error("Generate err:", err);
      alert("Failed to generate. See console.");
    } finally {
      setLoading(false);
    }
  }

  function downloadDataUrl(dataUrl: string, filename = "thumbnail.png") {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="rounded-2xl bg-white/6 p-8 shadow-md border border-white/8">
        <h1 className="text-2xl font-semibold mb-2">Thumbnail Studio</h1>
        <p className="text-sm text-gray-300 mb-6">
          Upload a base image and generate CTR-optimised thumbnails (Apple-style, minimal UI).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left column: uploader + options */}
          <div>
            <div className="mb-4">
              <input ref={inputRef} type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
              <div className="flex gap-3">
                <Button onClick={onClickUpload} className="px-4 py-2">Upload Image</Button>
                <Button onClick={() => { setFile(null); setPreviewUrl("/mnt/data/A_2D_digital_image_displays_a_dashboard_interface_.png"); }} variant="outline" className="px-4 py-2">Reset</Button>
              </div>
            </div>

            <label className="block text-sm mb-1">Style</label>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setStyle("ctr")} className={`px-3 py-2 rounded ${style==="ctr" ? "bg-blue-600 text-white" : "bg-white/6"}`}>CTR Boost</button>
              <button onClick={() => setStyle("minimal")} className={`px-3 py-2 rounded ${style==="minimal" ? "bg-blue-600 text-white" : "bg-white/6"}`}>Minimal</button>
              <button onClick={() => setStyle("bold")} className={`px-3 py-2 rounded ${style==="bold" ? "bg-blue-600 text-white" : "bg-white/6"}`}>Bold</button>
            </div>

            <label className="block text-sm mb-1">Main text (optional)</label>
            <input value={textOverlay} onChange={(e)=>setTextOverlay(e.target.value)} className="w-full bg-white/4 rounded px-3 py-2 mb-4" placeholder="e.g. How I grew 100k subs" />

            <div className="flex gap-3">
              <Button onClick={generateThumbnails} disabled={loading} className="px-5 py-2">
                {loading ? "Generating…" : "Generate Thumbnails"}
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline">Back</Button>
            </div>

            <p className="text-xs text-gray-400 mt-4">Tip: hover generated results to reveal actions.</p>
          </div>

          {/* Center: live preview */}
          <div className="md:col-span-2">
            <div className="rounded-lg overflow-hidden border border-white/8 bg-white/3 p-4">
              <div className="text-sm text-gray-300 mb-3">Live Preview</div>
              <div className="bg-white/5 rounded-lg p-6 flex items-center justify-center" style={{ minHeight: 260 }}>
                {/* use next/image only for remote/public URLs, show fallback for local preview */}
                <img src={previewUrl} alt="preview" style={{ maxHeight: 420, width: "auto", borderRadius: 8 }} />
              </div>
            </div>

            {/* generated grid */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Generated Variations</h3>
                <p className="text-xs text-gray-400">{generated.length} results</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {generated.length === 0 ? (
                  <div className="col-span-full text-sm text-gray-500 p-6 rounded-lg border border-white/6">No generated thumbnails yet.</div>
                ) : generated.map((g, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-white/8">
                    <img src={g} alt={`thumb-${i}`} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                      <div className="text-xs text-white/90">Variation #{i+1}</div>
                      <div className="flex gap-2">
                        <button onClick={() => downloadDataUrl(g, `algo-thumb-${i+1}.png`)} className="px-2 py-1 text-xs bg-white/10 rounded">Download</button>
                        <button onClick={() => navigator.clipboard.writeText(g)} className="px-2 py-1 text-xs bg-white/10 rounded">Copy URL</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
