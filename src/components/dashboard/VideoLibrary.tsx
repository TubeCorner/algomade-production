"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner"; // ✅ consistent with your KeywordForm
import { Button } from "@/components/ui/button";

export function VideoLibrary() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* -------------------------------------------------------------------------- */
  /* 🧠 Fetch Saved Video Ideas                                                 */
  /* -------------------------------------------------------------------------- */
  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/get-video-ideas");
      const json = await res.json();
      setIdeas(json.ideas || []);
    } catch (err) {
      console.error("❌ Failed to load ideas:", err);
      toast.error("Unable to load saved ideas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  /* -------------------------------------------------------------------------- */
  /* 🗑 Delete an Idea                                                          */
  /* -------------------------------------------------------------------------- */
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this idea?");
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/ai/delete-video-idea?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");
      toast.success("🗑 Video idea deleted");
      await fetchIdeas(); // ✅ auto refresh
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error("Unable to delete this idea");
    } finally {
      setDeletingId(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🧭 UI Layout                                                               */
  /* -------------------------------------------------------------------------- */
  if (loading) return <p className="text-gray-400">Loading library...</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-white">📚 Video Idea Library</h2>

      {ideas.length === 0 ? (
        <p className="text-gray-400">No saved ideas yet.</p>
      ) : (
        <ul className="space-y-3">
          {ideas.map((idea) => (
            <li
              key={idea.id}
              className="p-4 bg-slate-800 border border-slate-700 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div>
                <p className="font-medium text-white">{idea.title}</p>
                {idea.keyword && (
                  <p className="text-sm text-gray-400 italic">{idea.keyword}</p>
                )}
                {idea.cta && (
                  <p className="text-xs text-gray-500 mt-1">{idea.cta}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(idea.id)}
                  disabled={deletingId === idea.id}
                  className="border-red-400 text-red-300 hover:bg-red-500/20"
                >
                  {deletingId === idea.id ? "Deleting..." : "🗑 Delete"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
