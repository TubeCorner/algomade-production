"use client";

import { createContext, useContext } from "react";

interface ProjectType {
  id: string;
  name?: string;
  description?: string;
}

interface DashboardContextType {
  projects: ProjectType[];
  selectedProject: ProjectType | null;
  setSelectedProject: (project: ProjectType | null) => void;

  refreshProjects: () => Promise<void>;

  // Trend Data Layer
  trendData: Record<string, any> | null;
  setTrendData: (data: Record<string, any> | null) => void;

  velocityCache: Record<string, number> | null;
  setVelocityCache: (cache: Record<string, number> | null) => void;

  refreshTrends: (projectId: string) => Promise<void>;
  refreshVelocity: (projectId: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error("useDashboard must be used within a DashboardProvider");
  return context;
};

/* -------------------------------------------------------
   🔥 STRICT Provider — validates selectedProject
------------------------------------------------------- */
export const DashboardProvider = ({
  children,
  value,
}: {
  value: DashboardContextType;
  children: React.ReactNode;
}) => {
  // 🛑 Fix: enforce valid selectedProject
  const safeValue: DashboardContextType = {
    ...value,
    selectedProject:
      value.selectedProject &&
      typeof value.selectedProject === "object" &&
      typeof value.selectedProject.id === "string" &&
      value.selectedProject.id !== "undefined" &&
      value.selectedProject.id !== "null" &&
      value.selectedProject.id.trim() !== ""
        ? value.selectedProject
        : null,
  };

  return (
    <DashboardContext.Provider value={safeValue}>
      {children}
    </DashboardContext.Provider>
  );
};
