"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProjectEditFormProps {
  projectId: string;
  initialName: string;
  initialDescription?: string | null;
  onUpdated?: (updated: { name?: string; description?: string }) => void;
}

export default function ProjectEditForm({
  projectId,
  initialName,
  initialDescription = "",
  onUpdated,
}: ProjectEditFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  async function handleUpdate() {
    if (!name.trim() && !description.trim()) {
      toast.error("Please provide at least one field to update");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      toast.success("✅ Project updated successfully!");
      setEditing(false);
      onUpdated?.({ name, description });
    } catch (err: any) {
      console.error("❌ Project update failed:", err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      {!editing ? (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800">{name}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <Button
            onClick={() => setEditing(true)}
            className="text-sm bg-gray-800 hover:bg-gray-700"
          >
            ✏️ Edit
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Project description (optional)"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
