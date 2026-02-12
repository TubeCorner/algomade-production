import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/* 📦 GET — Recent Insights */
export async function GET() {
  try {
    await cookies();

    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ insights: [] }, { status: 200 });
    }

    const { data, error } = await supabase
      .from("keyword_rank_insights")
      .select(
        "keyword, difficulty_score, avg_views, recommended_action, updated_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const formatted = (data || []).map((i) => ({
      keyword: i.keyword,
      summary: i.recommended_action,
      score: i.difficulty_score,
      views: i.avg_views,
      updated_at: i.updated_at,
    }));

    return NextResponse.json({ insights: formatted }, { status: 200 });
  } catch (err: any) {
    console.error("🔥 recent-insights API error:", err.message);
    return NextResponse.json(
      { insights: [], error: err.message },
      { status: 500 }
    );
  }
}

