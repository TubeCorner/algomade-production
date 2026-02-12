// src/components/projects/ProjectCard.tsx
"use client";

import Link from "next/link";
import React from "react";

interface Project {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  slug?: string;
  created_at?: string;
  keywords?: string[]; 
}

export default function ProjectCard({ project, onDeleted }: { project: Project; onDeleted?: () => void }) {
  const handleDelete = async () => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted?.();
    } else {
      alert("Failed to delete project");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg">{project.name ?? project.title ?? "Untitled Project"}</h3>
          <p className="text-xs text-gray-500">
            {project.created_at ? new Date(project.created_at).toLocaleString() : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${project.id}`} className="text-sm text-indigo-600 hover:underline">
            View
          </Link>
          <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        </div>
      </div>
      {project.description && <p className="text-sm text-gray-700">{project.description}</p>}
      {project.keywords && project.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {project.keywords.slice(0, 8).map((k, i) => (
            <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}



