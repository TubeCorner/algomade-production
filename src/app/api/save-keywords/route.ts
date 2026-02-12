// src/app/api/save-keywords/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    await cookies();
    const session = (await getServerSession(authOptions)) ;
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const supabase = await createServerSupabase();

    const { projectId, keywords, source, metrics, insightPayload } =
      await req.json();

    if (!projectId || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "Missing projectId or keywords[]" },
        { status: 400 }
      );
    }

    /* ----------------------------------------------
       CLEAN INPUT
    ---------------------------------------------- */
    const finalSource: "ai" | "youtube" | "manual" =
      source === "ai" ? "ai" : source === "youtube" ? "youtube" : "manual";

    const cleaned = [...new Set(
      keywords.map((k: string) => k?.trim())
    )].filter(Boolean);

    /* ----------------------------------------------
       UPSERT keyword_projects
    ---------------------------------------------- */
    const projectRows = cleaned.map((kw: string) => ({
      user_id: userId,
      project_id: projectId,
      keyword: kw,
      source: finalSource,
      created_at: new Date().toISOString(),
      trend_direction: "stable",
      velocity: 0,
      video_count: 0,
      avg_views: 0,
      trend_7d: 0,
      trend_30d: 0,
      opportunity: 0,
      freshness: metrics?.freshness ?? null,
      difficulty: metrics?.difficulty ?? null,
      rank_potential: metrics?.rank_potential ?? null,
    }));

    const { data: savedKeywords, error } = await supabase
      .from("keyword_projects")
      .upsert(projectRows, { onConflict: "user_id,project_id,keyword" })
      .select("*");

    if (error) throw error;

    /* ----------------------------------------------
       UPSERT trending_keywords (placeholder rows)
    ---------------------------------------------- */
    const trendingRows = cleaned.map((kw: string) => ({
      user_id: userId,
      project_id: projectId,
      keyword: kw,
      direction: "stable",
      velocity: 0,
      trend_7d: 0,
      trend_30d: 0,
      yt_avg_views: 0,
      yt_new_uploads: 0,
      opportunity_score: 0,
      updated_at: new Date().toISOString(),
    }));

    const { error: tErr } = await supabase
      .from("trending_keywords")
      .upsert(trendingRows, { onConflict: "user_id,project_id,keyword" });

    if (tErr) throw tErr;

    /* ----------------------------------------------
       UPSERT keyword_insights
    ---------------------------------------------- */
    const insightsRows = cleaned.map((kw: string) => {
      const ai = insightPayload?.[kw] ?? {};
      return {
        user_id: userId,
        project_id: projectId,
        keyword: kw,
        summary: ai.summary || "",
        why_now: ai.why_now || "",
        tips: ai.tips || "",
        confidence: ai.confidence ?? 0.6,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { error: insightErr } = await supabase
      .from("keyword_insights")
      .upsert(insightsRows, {
        onConflict: "user_id,project_id,keyword",
      });

    if (insightErr) throw insightErr;

    /* ============================================================
       🚀 NEW: TRIGGER YOUTUBE TREND COMPUTATION (THE MISSING LINK)
       ============================================================ */
    if (finalSource === "youtube") {
      // fire-and-forget (do NOT block save UX)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/keywords/trends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          keywords: cleaned,
        }),
      }).catch((err) =>
        console.error("Trend trigger failed:", err)
      );
    }

    /* ----------------------------------------------
       FINAL RESPONSE
    ---------------------------------------------- */
    return NextResponse.json({
      success: true,
      savedCount: savedKeywords?.length || 0,
      source: finalSource,
    });
  } catch (err: any) {
    console.error("❌ save-keywords error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


