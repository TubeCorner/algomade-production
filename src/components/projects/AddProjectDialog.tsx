// src/components/projects/AddProjectDialog.tsx
"use client";

import React, { useState } from "react";

export default function AddProjectDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);

  const createProject = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    // If you want user_id from session, your API should check server session; here we send without user_id (server uses session)
    const payload = {
      name: title,
      description,
      keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create");
      onCreated();
      setTitle("");
      setDescription("");
      setKeywords("");
    } catch (err) {
      console.error(err);
      alert("Error creating project");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={createProject} className="relative z-50 w-full max-w-lg bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-3">Create new project</h2>
        <input
          className="w-full border rounded p-2 mb-3"
          placeholder="Project title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border rounded p-2 mb-3"
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="w-full border rounded p-2 mb-4"
          placeholder="Keywords (comma-separated)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-indigo-600 text-white">
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}



