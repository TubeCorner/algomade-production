"use client";

import { useState, useEffect } from "react";

export function usePlan() {
  const [plan, setPlan] = useState<"free" | "pro" | "elite">("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch("/api/user/plan");
        const data = await res.json();
        if (data?.plan) setPlan(data.plan);
      } catch (err) {
        console.warn("Plan fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  return { plan, loading, isPro: plan === "pro" || plan === "elite" };
}

