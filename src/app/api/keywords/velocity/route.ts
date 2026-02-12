import { NextResponse } from "next/server";
import googleTrends from "google-trends-api";

/* ---------------------------------------------
   Helper — safely normalize keywords input
--------------------------------------------- */
function normalizeKeywords(param: string): string[] {
  try {
    // If frontend passed JSON.stringify([...])
    const parsed = JSON.parse(param);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.keyword) return String(item.keyword);
          return null;
        })
        .filter(Boolean) as string[];
    }
  } catch (_) {
    // Fallback: treat it as comma-separated
  }

  return param.split(",").map((k) => k.trim()).filter(Boolean);
}

/* ---------------------------------------------
   Helper — get Google Trends score
--------------------------------------------- */
async function getTrendScore(keyword: string, timeframe: string) {
  try {
    const raw = await googleTrends.interestOverTime({
      keyword,
      geo: "IN",
      timeframe,
    });

    if (!raw || raw.startsWith("<")) return 0;

    const parsed = JSON.parse(raw);
    const timeline = parsed?.default?.timelineData ?? [];
    if (!timeline.length) return 0;

    const values: number[] = timeline.map(
  (t: any) => Number(t.value?.[0]) || 0
);
    return values.reduce((a, b) => a + b, 0) / values.length;
  } catch (err: any) {
    console.warn(`⚠ getTrendScore failed for "${keyword}"`);
    return 0;
  }
}

/* ---------------------------------------------
   GET — Compute Velocity
--------------------------------------------- */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kwParam = searchParams.get("keywords");

    if (!kwParam) {
      return NextResponse.json(
        { error: "Missing keywords" },
        { status: 400 }
      );
    }

    // 🔥 FIX: normalize into clean array
    const keywords = normalizeKeywords(kwParam);

    if (!keywords.length) {
      return NextResponse.json(
        { error: "No valid keywords provided" },
        { status: 400 }
      );
    }

    const results = [];

    for (const keyword of keywords) {
      const avg7 = await getTrendScore(keyword, "today 7-d");
      const avg30 = await getTrendScore(keyword, "today 30-d");

      const velocity = avg30 ? ((avg7 - avg30) / avg30) * 100 : 0;
      const direction =
        velocity > 20
          ? "explosive"
          : velocity > 5
          ? "rising"
          : velocity < -5
          ? "falling"
          : "stable";

      results.push({
        keyword,
        avg7,
        avg30,
        velocity,
        direction,
      });
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("🔥 Velocity API error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

