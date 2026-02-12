"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import KeywordForm from "@/components/forms/KeywordForm";
import toast from "react-hot-toast";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 🧭 Fetch project details
  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      setKeywords(data.keywords || []);
    } else {
      toast.error("Failed to load project");
    }
  };

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  // ➕ Add keywords
  const handleKeywordSubmit = async (newKeywords: string[]) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: newKeywords }),
      });

      if (!res.ok) throw new Error("Failed to save keywords");

      setKeywords((prev) => [...prev, ...newKeywords]);
      toast.success("✅ Keywords added!");
    } catch (err: any) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!project) return <p className="p-6">Loading project...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      {project.description && (
        <p className="text-gray-500">{project.description}</p>
      )}

      {/* ➕ Add Keywords */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Add Keywords</h2>
        <KeywordForm
          onSubmit={handleKeywordSubmit}
          isLoading={loading}
          placeholder="Enter keywords here..."
        />
      </div>

      {/* 🪄 List of keywords */}
      {keywords.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
