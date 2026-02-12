"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useDashboard } from "@/contexts/DashboardContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ProjectEditForm from "@/components/dashboard/ProjectEditForm";

export default function ProjectSidebar() {
  const {
    projects,
    selectedProject,
    setSelectedProject,
    refreshProjects,
  } = useDashboard();

  const [newProjectName, setNewProjectName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  /* -------------------------------------------------------------------------- */
  /* ➕ CREATE PROJECT                                                          */
  /* -------------------------------------------------------------------------- */
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return toast.error("Enter a project name");
    setCreating(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");

      toast.success(`🆕 Project "${data.name}" created`);

      await refreshProjects();

      // 🔥 SELECT FULL PROJECT OBJECT, NOT JUST ID
      setSelectedProject(data);

      setNewProjectName("");
      setNewDescription("");
    } catch (err) {
      console.error("❌ Project creation error:", err);
      toast.error("Unable to create project");
    } finally {
      setCreating(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🧭 SIDEBAR UI                                                             */
  /* -------------------------------------------------------------------------- */
  return (
    <aside className="bg-[#0F172A]/80 border-r border-white/10 w-80 flex flex-col justify-between shadow-lg backdrop-blur-md text-white">
      {/* Projects List */}
      <div className="p-5 overflow-y-auto">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span>📁</span> Your Projects
        </h2>

        {!projects || projects.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No projects yet.</p>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => {
              const isActive = selectedProject?.id === project.id;

              return (
                <li
                  key={project.id}
                  className={`flex items-center justify-between gap-1 px-3 py-2 rounded-md transition border ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border-blue-600/30"
                      : "border-transparent text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <button
                    onClick={() => {
                      // 🔥 Pass full project
                      setSelectedProject(project);
                      window.dispatchEvent(new Event("refreshKeywords"));
                    }}
                    className="flex-1 text-left truncate text-sm font-medium"
                  >
                    {project.name}
                  </button>

                  {/* ✏️ Edit */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProject(project);
                    }}
                    className="text-gray-400 hover:text-blue-400 text-sm px-2"
                    title="Edit Project"
                  >
                    ✏️
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <hr className="border-white/10 mx-4 my-3" />

      {/* Create Project */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <input
          type="text"
          placeholder="Project name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleCreateProject}
          disabled={creating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:bg-gray-500/50"
        >
          {creating ? "Creating…" : "＋ Create Project"}
        </button>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="max-w-md bg-slate-900 text-white border border-slate-700">
          <DialogTitle className="text-lg font-semibold text-white/90 mb-2">
            Edit Project
          </DialogTitle>

          {editingProject && (
            <ProjectEditForm
              projectId={editingProject.id}
              initialName={editingProject.name}
              initialDescription={editingProject.description}
              onUpdated={async () => {
                await refreshProjects();
                setEditingProject(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </aside>
  );
}
