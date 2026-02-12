// src/app/api/keywords/trends/cache/route.ts

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import googleTrends from "google-trends-api";

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/* -------------------------------------------------------
   POST — process one or multiple keywords
------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const { keyword, keywords } = await req.json();

    if (!keyword && !keywords) {
      return NextResponse.json(
        { success: false, error: "Keyword(s) required" },
        { status: 400 }
      );
    }

    // Get auth session
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? null; // null allowed for public cache

    /* ------------------- MULTI KEYWORD MODE ------------------- */
    if (Array.isArray(keywords)) {
      const results: Record<string, string> = {};

      for (const kw of keywords) {
        const { trendDirection } = await processKeyword(kw, supabase, userId);
        results[kw] = trendDirection;
      }

      return NextResponse.json({
        success: true,
        fromCache: false,
        trends: results,
      });
    }

    /* ------------------- SINGLE KEYWORD MODE ------------------- */
    const { trendDirection, chartData, fromCache } = await processKeyword(
      keyword,
      supabase,
      userId
    );

    return NextResponse.json({
      success: true,
      keyword,
      fromCache,
      trendDirection,
      chartData,
    });
  } catch (err) {
    console.error("Trend Cache API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------
   Helper — Load, Fetch, Save Keyword Trend
------------------------------------------------------- */
async function processKeyword(
  keyword: string,
  supabase: any,
  userId: string | null
) {
  /* --------- 1. Try Cached Value --------- */
  const { data: cached } = await supabase
    .from("keyword_trends_cache")
    .select("*")
    .eq("keyword", keyword)
    .single();

  if (cached) {
    const isFresh =
      Date.now() - new Date(cached.updated_at).getTime() < CACHE_TTL;

    if (isFresh) {
      return {
        fromCache: true,
        trendDirection: cached.trend_direction,
        chartData: cached.chart_data,
      };
    }
  }

  /* --------- 2. Fetch Google Trends --------- */
  let trendDirection: "rising" | "falling" | "stable" = "stable";
  let chartData: any[] = [];

  try {
    const raw = await googleTrends.interestOverTime({
      keyword,
      geo: "IN",
      timeframe: "today 12-m",
    });

    if (!raw || raw.startsWith("<") || raw.includes("<HTML>")) {
      throw new Error("Blocked by Google");
    }

    const parsed = JSON.parse(raw);
    const timeline = parsed?.default?.timelineData || [];

   const values: number[] = timeline.map((t: any) =>
  parseInt(t.value[0], 10)
);

if (values.length === 0) {
  throw new Error("No trend data available");
}

const latest = values.at(-1)!;
const avg = values.reduce((a, b) => a + b, 0) / values.length;

trendDirection =
  latest > avg * 1.2
    ? "rising"
    : latest < avg * 0.8
    ? "falling"
    : "stable";

    chartData = timeline.map((t: any) => ({
      date: t.formattedTime,
      value: t.value[0],
    }));
  } catch (err) {
    console.warn(`⚠️ Trend fallback for "${keyword}"`, err);
    chartData = generateStableFallback();
  }

  /* --------- 3. Save/Overwrite Cache --------- */
  await supabase.from("keyword_trends_cache").upsert({
    keyword,
    user_id: userId, // optional
    trend_direction: trendDirection,
    chart_data: chartData,
    updated_at: new Date().toISOString(),
  });

  return { fromCache: false, trendDirection, chartData };
}

/* -------------------------------------------------------
   Fallback Chart Generator
------------------------------------------------------- */
function generateStableFallback() {
  return Array.from({ length: 12 }, (_, i) => ({
    date: `M${i + 1}`,
    value: Math.round(40 + Math.random() * 10),
  }));
}

