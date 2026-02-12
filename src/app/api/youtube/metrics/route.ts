import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * YouTube Metrics API
 * - Uses SERVICE ROLE (admin) because it updates DB
 * - Caches results for 24h
 * - Supports DEV mock + PROD live fetch
 */

const YT_API = process.env.YOUTUBE_API_KEY;
const ENV = process.env.NEXT_PUBLIC_ENVIRONMENT || "dev";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false }, // ⚠️ required for admin usage
    }
  );
}

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();
    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin (); // ✅;
    const now = Date.now();
    const TTL = 24 * 60 * 60 * 1000; // 24 hours

    /* -------------------------------------------------------------------------- */
    /* 1️⃣ READ CACHE (keyword_projects)                                           */
    /* -------------------------------------------------------------------------- */
    const { data: existing, error: fetchErr } = await supabase
      .from("keyword_projects")
      .select(
        "keyword, video_count, avg_views, freshness, difficulty, opportunity, rank_potential, updated_at, created_at"
      )
      .eq("keyword", keyword)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.warn("⚠️ Cache read error:", fetchErr.message);
    }

    const last = existing?.updated_at || existing?.created_at;

    if (existing && last) {
      const age = now - new Date(last).getTime();
      if (age < TTL) {
        console.log(`🪣 Cache HIT for "${keyword}"`);
        return NextResponse.json({
          ...existing,
          cached: true,
        });
      }
    }

    /* -------------------------------------------------------------------------- */
    /* 2️⃣ GENERATE FRESH METRICS (DEV → MOCK, PROD → YouTube API)                */
    /* -------------------------------------------------------------------------- */
    let metrics: any = {};

    if (ENV === "dev") {
      console.log(`⚙️ Using MOCK metrics for "${keyword}"`);

      const video_count = Math.floor(Math.random() * 1200) + 100;
      const avg_views = Math.floor(Math.random() * 90000) + 15000;
      const freshness = Math.floor(Math.random() * 70) + 20;

      const difficulty = Math.min(
        100,
        Math.round((avg_views / 100000) * 60 + (video_count / 10000) * 40)
      );

      const opportunity = Math.round((100 - difficulty) * (freshness / 100));
      const rank_potential = Math.round((freshness + opportunity) / 2);

      metrics = {
        keyword,
        video_count,
        avg_views,
        freshness,
        difficulty,
        opportunity,
        rank_potential,
      };
    } else {
      console.log(`🌐 Fetching LIVE YouTube metrics for "${keyword}"`);

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(
        keyword
      )}&key=${YT_API}`;

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchData.items || searchData.items.length === 0) {
        throw new Error("No results from YouTube search API");
      }

      const videoIds = searchData.items.map((x: any) => x.id.videoId).join(",");

      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${YT_API}`;
      const statsRes = await fetch(statsUrl);
      const statsData = await statsRes.json();

      const views: number[] = statsData.items.map((v: any) =>
  parseInt(v.statistics.viewCount || "0", 10)
);

      const avg_views = Math.round(
        views.reduce((a, b) => a + b, 0) / views.length
      );

      const totalVideos = searchData.pageInfo.totalResults;

      const thirtyDaysAgo = Date.now() - 30 * 86400000;

      const freshVideos = statsData.items.filter(
        (v: any) =>
          new Date(v.snippet.publishedAt).getTime() > thirtyDaysAgo
      ).length;

      const freshness = Math.round(
        (freshVideos / statsData.items.length) * 100
      );

      // formula
      const difficulty = Math.min(
        100,
        Math.round((avg_views / 100000) * 60 + (totalVideos / 10000) * 40)
      );

      const opportunity = Math.round((100 - difficulty) * (freshness / 100));
      const rank_potential = Math.round((freshness + opportunity) / 2);

      metrics = {
        keyword,
        video_count: totalVideos,
        avg_views,
        freshness,
        difficulty,
        opportunity,
        rank_potential,
      };
    }

    /* -------------------------------------------------------------------------- */
    /* 3️⃣ UPSERT (refresh cache)                                                  */
    /* -------------------------------------------------------------------------- */
    const { error: upErr } = await supabase
      .from("keyword_projects")
      .upsert(
        {
          keyword,
          ...metrics,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "keyword" }
      );

    if (upErr) {
      console.warn("⚠️ Cache update failed:", upErr.message);
    } else {
      console.log(`🆕 Cached fresh metrics for "${keyword}"`);
    }

    return NextResponse.json(metrics);
  } catch (err: any) {
    console.error("❌ YouTube metrics API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

