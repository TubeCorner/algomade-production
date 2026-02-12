"use client";
import { useState, useEffect, useMemo } from "react";

/**
 * 🧠 Quota Manager Hook
 * Tracks AI generations per day and resets at midnight (client-side only).
 */
const DAILY_LIMIT = 3;

export function useQuotaManager() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const STORAGE_KEY = "ai-usage-tracker";

  const [usage, setUsage] = useState(0);
  const [limit] = useState(DAILY_LIMIT);
  const [reached, setReached] = useState(false);

  /**
   * 🔄 Load stored usage on mount
   */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) {
          setUsage(parsed.count || 0);
        } else {
          // new day → reset
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ date: today, count: 0 })
          );
          setUsage(0);
        }
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ date: today, count: 0 })
        );
      }
    } catch (err) {
      console.warn("Quota load error:", err);
    }
  }, [today]);

  /**
   * 🚨 Update "reached" whenever usage changes
   */
  useEffect(() => {
    setReached(usage >= limit);
  }, [usage, limit]);

  /**
   * ➕ Increment usage count
   */
  const increment = () => {
    try {
      const newCount = usage + 1;
      setUsage(newCount);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: today, count: newCount })
      );
    } catch (err) {
      console.warn("Quota increment error:", err);
    }
  };

  return { usage, limit, reached, increment };
}

