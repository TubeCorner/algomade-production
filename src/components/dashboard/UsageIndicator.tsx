"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UsageData {
  plan?: string;
  used?: number;
  limit?: number;
}

export default function UsageIndicator({ refreshKey = 0 }: { refreshKey?: number }) {
  const [usage, setUsage] = useState<UsageData | null>(null);

  async function fetchUsage() {
    try {
      const res = await fetch("/api/user/usage", { cache: "no-store" });
      const data = await res.json();

      // ✅ Defensive normalization
      setUsage({
        plan: data?.plan ?? "free",
        used: data?.used ?? 0,
        limit: data?.limit ?? 0,
      });
    } catch (err) {
      console.error("Usage fetch error:", err);
      setUsage({
        plan: "free",
        used: 0,
        limit: 0,
      });
    }
  }

  useEffect(() => {
    fetchUsage();
  }, [refreshKey]);

  if (!usage) return null;

  const plan = usage.plan ?? "free";
  const used = usage.used ?? 0;
  const limit = usage.limit ?? 0;

  const progress =
    !limit || limit === Infinity
      ? 100
      : Math.min((used / limit) * 100, 100);

  return (
    <div className="p-3 bg-[#1E293B] border border-white/10 rounded-lg text-sm flex justify-between items-center text-gray-300 transition-all">
      <div className="flex items-center gap-2">
        {plan === "free" ? (
          <>
            <div className="w-36 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-2 bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>
              ⚡ <strong>{used}</strong> / {limit} keywords today
            </span>
          </>
        ) : (
          <span>
            🚀 Plan: <strong>{String(plan).toUpperCase()}</strong>
          </span>
        )}
      </div>

      {plan === "free" && (
        <Link href="/pricing">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 ml-3">
            Upgrade to Pro
          </Button>
        </Link>
      )}
    </div>
  );
}
