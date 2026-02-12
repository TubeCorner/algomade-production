"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
interface VideoIdea {
  id: string;
  project_id: string;
  keyword: string;
  title: string;
  hook: string;
  description: string;
  cta: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export default function IdeaLibraryPage() {
  const { data: session, status } = useSession();

  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  /* ---------------------------------------------------------------------- */
  /* 1️⃣ Fetch Projects                                                      */
  /* ---------------------------------------------------------------------- */
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch projects");
      setProjects(json || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error loading projects");
    }
  };

  /* ---------------------------------------------------------------------- */
  /* 2️⃣ Fetch Ideas                                                         */
  /* ---------------------------------------------------------------------- */
  const fetchIdeas = async (projId?: string) => {
    try {
      setLoading(true);

      const url = projId
        ? `/api/ai/get-video-ideas?project_id=${projId}`
        : `/api/ai/get-video-ideas`;

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load ideas");

      setIdeas(json.ideas || []);
    } catch (e: any) {
      toast.error(e.message || "Error loading ideas");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* 3️⃣ On Auth → Load Data                                                 */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects();
      fetchIdeas();
    }
  }, [status]);

  /* ---------------------------------------------------------------------- */
  /* 4️⃣ Listen for global "refreshIdeas" event                              */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const listener = () => fetchIdeas(projectFilter || undefined);
    window.addEventListener("refreshIdeas", listener);
    return () => window.removeEventListener("refreshIdeas", listener);
  }, [projectFilter]);

  /* ---------------------------------------------------------------------- */
  /* 5️⃣ Create New Project                                                  */
  /* ---------------------------------------------------------------------- */
  const handleAddProject = async () => {
    if (!newProjectName.trim()) return toast.error("Project name is required");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create project");

      toast.success(`Created project: ${json.name}`);

      setShowModal(false);
      setNewProjectName("");
      setNewProjectDesc("");

      await fetchProjects();
      setProjectFilter(json.id); // auto-select new project
      fetchIdeas(json.id);
    } catch (err: any) {
      toast.error(err.message || "Error creating project");
    }
  };

  /* ---------------------------------------------------------------------- */
  /* 6️⃣ Copy Idea                                                            */
  /* ---------------------------------------------------------------------- */
  const handleCopy = (idea: VideoIdea) => {
    const text = `🎬 ${idea.keyword}

Title: ${idea.title}

Hook: ${idea.hook}

Description: ${idea.description}

CTA: ${idea.cta}`;

    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Copy failed"));
  };

  /* ---------------------------------------------------------------------- */
  /* 7️⃣ Delete Idea                                                          */
  /* ---------------------------------------------------------------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this idea?")) return;
    try {
      const res = await fetch("/api/ai/delete-video-idea", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");

      setIdeas((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">💡 Idea Library</h2>
          <p className="text-sm text-gray-400">Saved Video Idea Packs</p>
        </div>

        {/* Project Filter */}
        <div className="flex gap-2 items-center">
          <select
            value={projectFilter}
            onChange={(e) => {
              const val = e.target.value;
              setProjectFilter(val);
              fetchIdeas(val || undefined);
            }}
            className="bg-slate-800 border border-slate-700 text-sm rounded px-2 py-1 text-gray-200"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded"
          >
            ➕ Add Project
          </button>
        </div>
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : ideas.length === 0 ? (
        <p className="text-gray-400 text-sm">No ideas saved yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-slate-900 text-white border border-slate-700 rounded-xl p-4 shadow hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-lg mb-1 truncate">
                {idea.keyword}
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {new Date(idea.created_at).toLocaleDateString()}
              </p>

              <p className="text-sm font-medium text-slate-200 mb-2">
                {idea.title}
              </p>
              <p className="text-xs text-slate-400 mb-2 italic">
                Hook: {idea.hook}
              </p>
              <p className="text-xs text-slate-400 mb-2">
                {idea.description}
              </p>
              <p className="text-xs text-slate-400 mb-3">
                CTA: {idea.cta}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(idea)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded"
                >
                  Copy
                </button>
                <button
                  onClick={() => handleDelete(idea.id)}
                  className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-semibold text-white mb-3">
              ➕ Create New Project
            </h3>

            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project Name"
              className="w-full px-3 py-2 text-sm rounded bg-slate-800 border border-slate-700 text-white mb-3"
            />

            <textarea
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              placeholder="Short description (optional)"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded bg-slate-800 border border-slate-700 text-white mb-3 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-xs px-3 py-1 rounded bg-slate-700 text-gray-300 hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProject}
                className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
