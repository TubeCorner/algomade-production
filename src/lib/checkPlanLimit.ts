// src/lib/checkPlanLimit.ts
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

/* -------------------------------------------------------------------------- */
/* 🧩 checkPlanLimit() — Validates usage limit based on user plan              */
/* -------------------------------------------------------------------------- */
export async function checkPlanLimit() {
  try {
    // 1️⃣ Authenticate user
    const session = (await getServerSession(authOptions)) ;
    const userId = session?.user?.id;
    if (!userId) return { allowed: false, message: "Unauthorized" };

    // 2️⃣ Initialize Supabase (SSR)
    const supabase = await createServerSupabase();

    // 3️⃣ Fetch user profile info
    const { data, error } = await supabase
      .from("profiles")
      .select("plan, daily_keyword_count, last_keyword_reset")
      .eq("id", userId)
      .single();

    if (error || !data)
      return { allowed: false, message: "Unable to fetch profile data" };

    const { plan, daily_keyword_count, last_keyword_reset } = data;

    // 4️⃣ Daily reset handling
    const now = Date.now();
    const last = last_keyword_reset ? new Date(last_keyword_reset).getTime() : 0;

    if (now - last >= 24 * 60 * 60 * 1000) {
      await supabase
        .from("profiles")
        .update({
          daily_keyword_count: 0,
          last_keyword_reset: new Date().toISOString(),
        })
        .eq("id", userId);

      return {
        allowed: true,
        plan,
        daily_keyword_count: 0,
        userId,
      };
    }

    // 5️⃣ Plan-based limits
    const limits = {
      free: 10,
      pro: Infinity,
      elite: Infinity,
    };

    const limit = limits[plan as keyof typeof limits] ?? 10;

    if (plan === "free" && daily_keyword_count >= limit) {
      return {
        allowed: false,
        message:
          "⚠️ Daily limit reached (10/day). Upgrade to Pro for unlimited keywords.",
      };
    }

    return { allowed: true, plan, daily_keyword_count, userId };
  } catch (err: any) {
    console.error("❌ checkPlanLimit error:", err.message);
    return { allowed: false, message: "Internal error checking plan limits" };
  }
}


