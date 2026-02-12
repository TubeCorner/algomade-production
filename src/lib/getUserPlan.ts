// src/lib/getUserPlan.ts
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Fetches the user's subscription plan
 * Safe for server-only usage (API routes, server actions)
 */
export async function getUserPlan(userId: string) {
  // ⚠️ Must await because createServerSupabase is async
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("❌ Failed to fetch user plan:", error.message);
    return "free";
  }

  return data?.plan || "free";
}

