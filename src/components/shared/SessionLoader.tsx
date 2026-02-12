"use client";

import { useSession } from "next-auth/react";

export default function SessionLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-pulse text-gray-500 text-sm">
          Loading your dashboard…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
