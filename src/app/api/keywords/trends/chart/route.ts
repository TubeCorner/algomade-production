import { NextResponse } from "next/server";
import googleTrends from "google-trends-api";
import { createServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";

/* -------------------------------------------------------------------------- */
/* ⚙️ CONFIG                                                                  */
/* -------------------------------------------------------------------------- */
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours
const MAX_CACHE_ENTRIES = 500;

/* -------------------------------------------------------------------------- */
/* 🧠 IN-MEMORY CACHE + INFLIGHT GUARD                                         */
/* -------------------------------------------------------------------------- */
const chartCache = new Map<string, { data: any; timestamp: number }>();
const inflight = new Map<string, Promise<any>>();

/* Safe cache setter (prevents memory leaks) */
function setCacheSafe(key: string, data: any) {
  if (chartCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = chartCache.keys().next().value;
    if (oldestKey) chartCache.delete(oldestKey);
  }
  chartCache.set(key, { data, timestamp: Date.now() });
}

/* -------------------------------------------------------------------------- */
/* 📌 POST — Fetch Google Trends Chart Data                                    */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    /* ---------------------------------------------------------------------- */
    /* 🍪 Cookie hydration (Next.js 15 consistency)                             */
    /* ---------------------------------------------------------------------- */
    await cookies();

    const isProd = process.env.NODE_ENV === "production";
    let userId: string | null = null;

    /* ---------------------------------------------------------------------- */
    /* 🔐 Auth (prod only)                                                      */
    /* ---------------------------------------------------------------------- */
    if (isProd) {
      const session = (await getServerSession(authOptions)) ;
      if (!session?.user?.id) {
        console.warn("🚫 Unauthorized chart request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    } else {
      userId = "dev-user";
    }

    /* ---------------------------------------------------------------------- */
    /* 🔍 Parse Input                                                           */
    /* ---------------------------------------------------------------------- */
    const body = await req.json().catch(() => ({}));
    const keywordRaw = (body?.keyword || "").toString().trim();
    const geo = (body?.geo || "IN").toString().trim();

    if (!keywordRaw) {
      return NextResponse.json({ error: "Keyword required" }, { status: 400 });
    }

    const keyword = keywordRaw.toLowerCase();

    /* ---------------------------------------------------------------------- */
    /* 🛡️ Abuse Protection                                                      */
    /* ---------------------------------------------------------------------- */
    if (keyword.length > 100) {
      return NextResponse.json(
        { error: "Keyword too long" },
        { status: 400 }
      );
    }

    if (!/^[\p{L}\p{N}\s\-_.]+$/u.test(keyword)) {
      return NextResponse.json(
        { error: "Invalid keyword format" },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* ⚡ Cache Check                                                           */
    /* ---------------------------------------------------------------------- */
    const cacheKey = `${keyword}::${geo}`;
    const cached = chartCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ data: cached.data, cached: true });
    }

    /* ---------------------------------------------------------------------- */
    /* 🚦 Stampede Protection                                                   */
    /* ---------------------------------------------------------------------- */
    if (inflight.has(cacheKey)) {
      const data = await inflight.get(cacheKey);
      return NextResponse.json({ data, cached: true });
    }

    /* ---------------------------------------------------------------------- */
    /* 📈 Fetch Google Trends (best-effort)                                     */
    /* ---------------------------------------------------------------------- */
    const fetchPromise = (async () => {
      let raw: string | null = null;

      try {
        raw = await googleTrends.interestOverTime({
          keyword,
          geo,
          timeframe: "today 12-m",
          category: 0,
        });
      } catch {
        return generateFallbackMonthly();
      }

      if (!raw || typeof raw !== "string" || raw.trim().startsWith("<")) {
        return generateFallbackMonthly();
      }

      try {
        const parsed = JSON.parse(raw);
        const timeline = parsed?.default?.timelineData ?? [];

        if (!Array.isArray(timeline) || timeline.length === 0) {
          return generateFallbackMonthly();
        }

        return timeline.map((t: any) => ({
          date: t.formattedTime || String(t.time || ""),
          value: Number(t.value?.[0]) || 0,
        }));
      } catch {
        return generateFallbackMonthly();
      }
    })();

    inflight.set(cacheKey, fetchPromise);

    const chartData = await fetchPromise;
    inflight.delete(cacheKey);

    setCacheSafe(cacheKey, chartData);

    return NextResponse.json({
      data: chartData,
      cached: false,
      source: chartData?.[0]?.value ? "google-trends" : "fallback",
    });
  } catch (error) {
    console.error("❌ Chart Route Fatal Error:", error);
    const fallback = generateFallbackMonthly();
    return NextResponse.json({
      data: fallback,
      fallback: true,
      source: "fallback",
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 🪄 Fallback Generator — Stable Monthly Data                                 */
/* -------------------------------------------------------------------------- */
function generateFallbackMonthly() {
  const now = new Date();
  const months = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    months.push({
      date: label,
      value: 45, // stable neutral baseline
    });
  }

  return months;
}


