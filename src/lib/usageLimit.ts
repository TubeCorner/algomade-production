// src/lib/usageLimit.ts
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Checks whether a user has exceeded their keyword usage limit.
 * RLS-safe: uses createServerSupabase() so auth.uid() works correctly.
 */
export async function checkUsageLimit(userId: string, limit = 20) {
  // MUST await the async Supabase server client
  const supabase = await createServerSupabase();

  const { count, error } = await supabase
    .from("keywords")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;

  return (count ?? 0) >= limit;
}

