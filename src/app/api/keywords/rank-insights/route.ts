import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

/* -------------------------------------------------------------------------- */
/* 🧠 Difficulty Score Calculation                                            */
/* -------------------------------------------------------------------------- */
function computeRankDifficulty(channels: any[]): number {
  if (!Array.isArray(channels) || channels.length === 0) return 0;

  const avgSubs =
    channels.reduce((sum, c) => sum + (Number(c.subs) || 0), 0) /
    channels.length;

  const avgViews =
    channels.reduce((sum, c) => sum + (Number(c.views) || 0), 0) /
    channels.length;

  const normSubs = Math.min(Math.log10(avgSubs + 1) / 6, 1);
  const normViews = Math.min(Math.log10(avgViews + 1) / 7, 1);

  const difficulty = Math.pow(0.65 * normSubs + 0.35 * normViews, 0.9);
  return Math.round(difficulty * 100);
}

/* -------------------------------------------------------------------------- */
function getRecommendedAction(difficulty: number, avgViews: number) {
  if (difficulty <= 40 && avgViews < 100_000)
    return "🚀 Publish now — low competition and strong discovery potential.";

  if (difficulty <= 60 && avgViews < 300_000)
    return "🧠 Good timing — competition moderate, reachable audience.";

  if (difficulty <= 75)
    return "⚖️ Competitive niche — refine hook/title before posting.";

  if (difficulty <= 90)
    return "⏱️ Tough category — test with short-form content first.";

  return "🧊 Highly saturated — pivot or target a subtopic.";
}

/* -------------------------------------------------------------------------- */
/* 📊 POST — Compute Rank Insights                                            */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    await cookies();

    const { keyword } = await req.json();
    if (!keyword) {
      return NextResponse.json({ error: "Keyword missing" }, { status: 400 });
    }

    const normalized = keyword.toLowerCase().trim();
    const supabase = await createServerSupabase();

    /* --- AUTH --- */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? null;

    /* ---------------------------------------------------------------------- */
    /* 1️⃣ Read cached result (logged-in users only)                            */
    /* ---------------------------------------------------------------------- */
    if (userId) {
      const { data: existing } = await supabase
        .from("keyword_rank_insights")
        .select("*")
        .eq("keyword", normalized)
        .eq("user_id", userId)
        .gte(
          "updated_at",
          new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        )
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          keyword,
          difficulty_score: existing.difficulty_score,
          avg_subs: existing.avg_subs,
          avg_views: existing.avg_views,
          channel_count: existing.channel_count,
          recommended_action: getRecommendedAction(
            existing.difficulty_score,
            existing.avg_views
          ),
          cached: true,
        });
      }
    }

    /* ---------------------------------------------------------------------- */
    /* 2️⃣ Live Fetch from YouTube                                             */
    /* ---------------------------------------------------------------------- */
    const YT_KEY = process.env.YOUTUBE_API_KEY;
    if (!YT_KEY) throw new Error("Missing YOUTUBE_API_KEY");

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&q=${encodeURIComponent(
        normalized
      )}&key=${YT_KEY}`
    );

    if (!searchRes.ok) throw new Error("YouTube search error");

    const searchJson = await searchRes.json();
    const videoIds =
      searchJson.items?.map((v: any) => v?.id?.videoId).filter(Boolean) || [];

    if (videoIds.length === 0) {
      return NextResponse.json({ error: "No videos found" }, { status: 404 });
    }

    /* Video stats */
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(
        ","
      )}&key=${YT_KEY}`
    );

    const statsJson = await statsRes.json();
    const channelIds = Array.from(
      new Set(statsJson.items?.map((v: any) => v.snippet.channelId) || [])
    );

    /* Channel stats */
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(
        ","
      )}&key=${YT_KEY}`
    );

    const channelJson = await channelRes.json();
    const channels = Array.isArray(channelJson.items)
      ? channelJson.items.map((c: any) => ({
          id: c.id,
          subs: Number(c.statistics.subscriberCount) || 0,
          views: Number(c.statistics.viewCount) || 0,
        }))
      : [];

    const difficulty_score = computeRankDifficulty(channels);

    const avg_subs =
      channels.reduce((s: number, c: any) => s + c.subs, 0) /
      Math.max(channels.length, 1);

    const avg_views =
      channels.reduce((s: number, c: any) => s + c.views, 0) /
      Math.max(channels.length, 1);

    const recommended_action = getRecommendedAction(
      difficulty_score,
      avg_views
    );

    const result = {
      keyword: normalized,
      difficulty_score,
      avg_subs: Math.round(avg_subs),
      avg_views: Math.round(avg_views),
      channel_count: channels.length,
      recommended_action,
      updated_at: new Date().toISOString(),
    };

    /* ---------------------------------------------------------------------- */
    /* 3️⃣ Cache write (only for logged-in users, avoids RLS errors)           */
    /* ---------------------------------------------------------------------- */
    if (userId) {
      await supabase.from("keyword_rank_insights").upsert(
        {
          ...result,
          user_id: userId,
        },
        { onConflict: "user_id,keyword" }
      );
    }

    return NextResponse.json({ ...result, cached: false });
  } catch (err: any) {
    console.error("Rank Insight Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/* 📖 GET — Recent Rank Insights                                             */
/* -------------------------------------------------------------------------- */
export async function GET() {
  try {
    await cookies();

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? null;
    if (!userId)
      return NextResponse.json({ results: [] });

    const { data, error } = await supabase
      .from("keyword_rank_insights")
      .select(
        "keyword, difficulty_score, avg_subs, avg_views, channel_count, recommended_action, updated_at"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ results: data || [] });
  } catch (err: any) {
    console.error("Rank GET error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

