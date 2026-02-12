"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function CreateProjectForm({ onProjectCreated }: { onProjectCreated?: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating project...");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) throw new Error("Failed to create project");

      toast.success("✅ Project created", { id: toastId });
      setName("");
      setDescription("");

      if (onProjectCreated) onProjectCreated();
    } catch (err: any) {
      toast.error(`❌ ${err.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-3">
      <input
        type="text"
        placeholder="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <textarea
        placeholder="Project Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white rounded-md px-4 py-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors"
      >
        {loading ? "Creating..." : "Create Project"}
      </button>
    </form>
  );
}
