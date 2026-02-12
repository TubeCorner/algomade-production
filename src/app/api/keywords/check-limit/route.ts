import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { createServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Required for Next.js 15
    await cookies();

    // Auth
    const session = (await getServerSession(authOptions)) ;
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { allowed: false, reason: "unauthorized" },
        { status: 401 }
      );
    }

    // MUST await here
    const supabase = await createServerSupabase();

    // Fetch plan + usage
    const { data, error } = await supabase
      .from("profiles")
      .select("plan, daily_keyword_count, last_keyword_reset")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("DB fetch error:", error);
      return NextResponse.json({ allowed: true }); // fail-open
    }

    const { plan, daily_keyword_count, last_keyword_reset } = data;

    const now = new Date();
    const lastReset = new Date(last_keyword_reset || 0);
    const hoursSinceReset =
      (now.getTime() - lastReset.getTime()) / 36e5;

    let currentCount = daily_keyword_count;

    /* ------------------------------------------------------
       🔄 Daily reset
    ------------------------------------------------------- */
    if (hoursSinceReset >= 24) {
      currentCount = 0;
      await supabase
        .from("profiles")
        .update({
          daily_keyword_count: 0,
          last_keyword_reset: now.toISOString(),
        })
        .eq("id", userId);
    }

    /* ------------------------------------------------------
       🟣 Unlimited Plans (Pro / Elite)
    ------------------------------------------------------- */
    if (plan === "pro" || plan === "elite") {
      return NextResponse.json({ allowed: true, limit: null });
    }

    /* ------------------------------------------------------
       🟡 Free Plan Limit = 10/day
    ------------------------------------------------------- */
    const LIMIT = 10;

    if (currentCount >= LIMIT) {
      return NextResponse.json({ allowed: false, limit: LIMIT });
    }

    // Increment for this request
    await supabase
      .from("profiles")
      .update({ daily_keyword_count: currentCount + 1 })
      .eq("id", userId);

    return NextResponse.json({
      allowed: true,
      remaining: LIMIT - (currentCount + 1),
    });
  } catch (err: any) {
    console.error("❌ Limit check error:", err.message);
    return NextResponse.json({ allowed: true }); // fail-open safety
  }
}

