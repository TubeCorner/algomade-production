import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { computeOpportunityScore } from "@/lib/computeOpportunityScore";

/* ------------------------------------------------------------
   CONFIG
------------------------------------------------------------ */
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/* ------------------------------------------------------------
   YOUTUBE METRICS
------------------------------------------------------------ */
async function fetchYouTubeTrend(keyword: string) {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) throw new Error("Missing YOUTUBE_API_KEY");

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&q=${encodeURIComponent(
        keyword
      )}&key=${API_KEY}`
    );

    const searchJson = await searchRes.json();
    const ids =
      searchJson.items?.map((i: any) => i.id?.videoId).filter(Boolean) || [];

    if (!ids.length) {
      return {
        direction: "stable",
        velocity: 0,
        trend_7d: 0,
        trend_30d: 0,
        yt_avg_views: 0,
        yt_new_uploads: 0,
        opportunity_score: 0,
      };
    }

    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids.join(
        ","
      )}&key=${API_KEY}`
    );

    const statsJson = await statsRes.json();
    const videos = statsJson.items || [];

    const now = new Date();
    const last7 = new Date(now.getTime() - 7 * 86400000);
    const last30 = new Date(now.getTime() - 30 * 86400000);

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const avg7 = avg(
      videos
        .filter((v: any) => new Date(v.snippet.publishedAt) >= last7)
        .map((v: any) => Number(v.statistics?.viewCount || 0))
    );

    const avg30 = avg(
      videos
        .filter((v: any) => new Date(v.snippet.publishedAt) >= last30)
        .map((v: any) => Number(v.statistics?.viewCount || 0))
    );

    const rawVelocity = avg30 > 0 ? ((avg7 - avg30) / avg30) * 100 : 0;
    const velocity = Math.max(-100, Math.min(300, Math.round(rawVelocity)));

    const direction =
      velocity > 30 ? "rising" : velocity < -15 ? "falling" : "stable";

    const yt_avg_views = Math.round(avg(
      videos.map((v: any) => Number(v.statistics?.viewCount || 0))
    ));

    const yt_new_uploads = videos.filter(
      (v: any) => new Date(v.snippet.publishedAt) >= last7
    ).length;

    const opportunity_score = computeOpportunityScore({
      velocity,
      yt_avg_views,
      yt_new_uploads,
    });

    return {
      direction,
      velocity,
      trend_7d: Math.round(avg7),
      trend_30d: Math.round(avg30),
      yt_avg_views,
      yt_new_uploads,
      opportunity_score,
    };
  } catch {
    return {
      direction: "stable",
      velocity: 0,
      trend_7d: 0,
      trend_30d: 0,
      yt_avg_views: 0,
      yt_new_uploads: 0,
      opportunity_score: 0,
    };
  }
}

/* ------------------------------------------------------------
   SHARED HANDLER (USED BY GET + POST)
------------------------------------------------------------ */
async function handleTrends(projectId: string, userId: string) {
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("trending_keywords")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  const trendsMap: Record<string, any> = {};
  const now = Date.now();

  for (const row of data || []) {
    const updatedAt = new Date(row.updated_at).getTime();
    const stale = now - updatedAt > CACHE_TTL;

    let finalRow = row;

    if (!row.direction || stale) {
      const metrics = await fetchYouTubeTrend(row.keyword);

      await supabase
        .from("trending_keywords")
        .update({
          ...metrics,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      finalRow = { ...row, ...metrics };
    }

    trendsMap[finalRow.keyword.toLowerCase()] = {
      direction: finalRow.direction,
      potential:
        finalRow.opportunity_score > 70
          ? "high"
          : finalRow.opportunity_score > 40
          ? "medium"
          : "low",
    };
  }

  return trendsMap;
}

/* ------------------------------------------------------------
   GET
------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) ;
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projectId = new URL(req.url).searchParams.get("project_id");
    if (!projectId)
      return NextResponse.json({ trends: {} });

    const trends = await handleTrends(projectId, session.user.id);
    return NextResponse.json({ trends });
  } catch {
    return NextResponse.json({ trends: {} });
  }
}

/* ------------------------------------------------------------
   ✅ POST — THIS WAS MISSING
------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) ;
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const projectId = body?.project_id;

    if (!projectId)
      return NextResponse.json({ trends: {} });

    const trends = await handleTrends(projectId, session.user.id);
    return NextResponse.json({ trends });
  } catch {
    return NextResponse.json({ trends: {} });
  }
}


