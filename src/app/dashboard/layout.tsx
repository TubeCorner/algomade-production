"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import ProjectSidebar from "@/components/dashboard/ProjectSidebar";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { DashboardProvider } from "@/contexts/DashboardContext";
import toast, { type Toast } from "react-hot-toast";

/* -------------------------------------------------------------------------- */
/* 💼 Dashboard Layout                                                        */
/* -------------------------------------------------------------------------- */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [loadingSidebar, setLoadingSidebar] = useState(true);

  // ❌ Removed deleting + delete handler from provider (kept local)
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteProject = async (id: string) => {
    const projectName = projects.find((p) => p.id === id)?.name || "this project";

toast.custom(
  (t: Toast) => (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm z-[9999] ${
        t.visible ? "animate-fadeIn" : "animate-fadeOut"
      }`}
    >
      <div className="bg-[#1E293B] border border-white/10 shadow-2xl rounded-xl p-6 w-96 text-center text-white">
        <h3 className="text-lg font-semibold mb-2">Delete project?</h3>
        <p className="text-sm text-gray-300 mb-5">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-red-400">{projectName}</span>?
          This action cannot be undone.
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm rounded-md bg-white/10 hover:bg-white/20 text-gray-200 transition"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss(t.id);
              setDeleting(id);

              try {
                const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Failed");

                await fetchProjects();
                toast.success(`🗑 Deleted "${projectName}"`);
              } catch (err) {
                console.error("Delete project error:", err);
                toast.error("Unable to delete project");
              } finally {
                setDeleting(null);
              }
            }}
            className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 transition text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ),
  { duration: 10000 }
);
};
  
  /* -------------------------------------------------------------------------- */
  /* 📌 Context State: Trends + Velocity                                       */
  /* -------------------------------------------------------------------------- */
  const [trendData, setTrendData] = useState<Record<string, any> | null>(null);
  const [velocityCache, setVelocityCache] = useState<Record<string, any> | null>(null);

  const { data: session, status } = useSession();

  /* -------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------- */
/* 📌 Fetch Projects                                                         */
/* -------------------------------------------------------------------------- */

const fetchProjects = useCallback(async () => {
  if (status !== "authenticated") return;

  try {
    setLoadingSidebar(true);

    const res = await fetch("/api/projects", {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("Projects API failed");
      return;
    }

    const data = await res.json();
    const safeProjects = Array.isArray(data) ? data : [];

    setProjects(safeProjects);

    // Only auto-select once
    setSelectedProject((prev: typeof selectedProject) => {
  if (prev) return prev;
  return safeProjects.length ? safeProjects[0] : null;
});

  } catch (err) {
    console.error("Fetch projects error:", err);
  } finally {
    setLoadingSidebar(false);
  }
}, [status]);
useEffect(() => {
  if (status !== "authenticated") return;

  console.log("SESSION STATUS:", status);
  console.log("CALLING fetchProjects");

  fetchProjects();
}, [status, fetchProjects]);

  /* -------------------------------------------------------------------------- */
  /* 📌 Refresh Trends                                                         */
  /* -------------------------------------------------------------------------- */
  const refreshTrends = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/keywords/trends?project_id=${projectId}`);
      const json = await res.json();
      if (res.ok) setTrendData(json.trends || {});
    } catch (err) {
      console.error("Trend fetch error:", err);
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 📌 Refresh Velocity                                                       */
  /* -------------------------------------------------------------------------- */
  const refreshVelocity = useCallback(async (projectId: string) => {
    try {
      const kwRes = await fetch(`/api/get-saved-keywords?project_id=${projectId}`);
      if (!kwRes.ok) throw new Error("Failed to load keywords");

      const kwJson = await kwRes.json();

      const keywords: string[] = Array.isArray(kwJson?.data)
        ? kwJson.data.map((k: any) => k.keyword).filter(Boolean)
        : Array.isArray(kwJson?.keywords)
        ? kwJson.keywords
        : [];

      if (!keywords.length) {
        setVelocityCache({});
        return;
      }

      const qs = encodeURIComponent(keywords.slice(0, 25).join(","));

      const res = await fetch(`/api/keywords/velocity?keywords=${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Velocity failed");

      const map: Record<string, any> = {};
      for (const row of json.results || []) {
        map[row.keyword] = {
          avg7: Number(row.avg7) || 0,
          avg30: Number(row.avg30) || 0,
          velocity: Number(row.velocity) || 0,
          direction: row.direction || "stable",
        };
      }

      setVelocityCache(map);
    } catch (err) {
      console.error("Velocity fetch error:", err);
      setVelocityCache({});
    }
  }, []);

  useEffect(() => {
    if (selectedProject?.id) {
      refreshTrends(selectedProject.id);
      refreshVelocity(selectedProject.id);
    }
  }, [selectedProject, refreshTrends, refreshVelocity]);

  /* -------------------------------------------------------------------------- */
  //* -------------------------------------------------------------------------- */
/* 📌 Render Layout                                                          */
/* -------------------------------------------------------------------------- */
return (
  <ProtectedRoute>
    <DashboardProvider
      value={{
        projects,
        selectedProject:
          selectedProject &&
          typeof selectedProject === "object" &&
          typeof selectedProject.id === "string"
            ? selectedProject
            : null,

        setSelectedProject,
        refreshProjects: fetchProjects,

        trendData,
        setTrendData,

        velocityCache,
        setVelocityCache,

        refreshTrends,
        refreshVelocity,
      }}
    >
      <div className="relative flex min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-gray-100 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex w-72 lg:w-80 flex-col border-r border-white/10 bg-white/5 backdrop-blur-md shadow-lg">
          {loadingSidebar ? <SidebarSkeleton /> : <ProjectSidebar />}
        </aside>

        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 md:hidden z-50 bg-white/10 border border-white/20 backdrop-blur-md p-2 rounded-lg text-white hover:bg-white/20 transition"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Mobile Sidebar Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden">
            <aside className="absolute top-0 left-0 h-full w-72 bg-[#0F172A] border-r border-white/10 shadow-2xl p-4 overflow-y-auto">
              {loadingSidebar ? <SidebarSkeleton /> : <ProjectSidebar />}
            </aside>
          </div>
        )}
{/* 📱 Mobile Notice */}
<div className="md:hidden px-4 pt-3">
  <div className="bg-indigo-500/10 border border-indigo-400/20 text-indigo-200 text-xs rounded-lg px-4 py-2 text-center">
    💻 AlgoMade works best on desktop for advanced keyword analytics.
  </div>
</div>
        {/* Main Workspace */}
          <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 py-10 transition-all duration-300">
            <div className="max-w-[1400px] mx-auto space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg">
                <div>
                  <h1 className="text-2xl font-bold text-white">Your Workspace</h1>
                  <p className="text-gray-400 text-sm">
                    Manage projects, keywords, and AI insights in one place.
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <a
                    href="/dashboard/trending"
                    className="flex items-center gap-1 text-gray-300 hover:text-white transition text-sm"
                  >
                    🔥 <span className="hidden sm:inline">Trending</span>
                  </a>
                  <a
                    href="/dashboard/ideas"
                    className="flex items-center gap-1 text-gray-300 hover:text-white transition text-sm"
                  >
                    💡 <span className="hidden sm:inline">Library</span>
                  </a>
                  <img
                    src={session?.user?.image || "/default-avatar.png"}
                    alt={session?.user?.name || "User Avatar"}
                    className="w-10 h-10 rounded-full border border-white/20 hover:border-blue-400 transition"
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10 p-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </DashboardProvider>
    </ProtectedRoute>
  );
}

/* -------------------------------------------------------------------------- */
/* 💡 Local Skeleton Component                                                */
/* -------------------------------------------------------------------------- */
function SidebarSkeleton() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="h-5 w-32 bg-white/20 rounded" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-full bg-white/10 rounded" />
        ))}
      </div>
      <hr className="border-white/10 my-4" />
      <div className="space-y-2">
        <div className="h-9 w-full bg-white/10 rounded" />
        <div className="h-9 w-full bg-white/10 rounded" />
      </div>
    </div>
  );
}
