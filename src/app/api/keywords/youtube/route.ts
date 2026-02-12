import { NextResponse } from "next/server";

// 🔍 Utility to fetch YouTube suggestions (SAFE)
async function fetchSuggestions(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
        query
      )}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    if (!res.ok) {
      console.error(`YT suggest HTTP ${res.status}`);
      return [];
    }

    const text = await res.text();
    if (!text) return [];

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.warn("YT suggest returned non-JSON");
      return [];
    }

    return Array.isArray(data?.[1]) ? data[1] : [];
  } catch (err) {
    console.error(`❌ Error fetching suggestions for "${query}":`, err);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    /* --------------------------------------------------
       ✅ SAFE BODY PARSE
    -------------------------------------------------- */
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const query =
      typeof body?.query === "string" ? body.query.trim() : "";
    const extended = Boolean(body?.extended);

    if (!query) {
      return NextResponse.json(
        { keywords: [], error: "Query is required" },
        { status: 400 }
      );
    }

    /* --------------------------------------------------
       🧠 Query variants
    -------------------------------------------------- */
    const baseVariants = [
      query,
      `${query} tutorial`,
      `${query} ideas`,
      `${query} for beginners`,
      `${query} tips`,
      `${query} tricks`,
      `${query} guide`,
      `${query} shorts`,
    ];

    const variants = extended ? baseVariants : [query];

    /* --------------------------------------------------
       🧩 Fetch suggestions
    -------------------------------------------------- */
    const allKeywords = new Set<string>();

    for (const variant of variants) {
      const suggestions = await fetchSuggestions(variant);
      suggestions.forEach((s) => {
        if (typeof s === "string" && s.trim()) {
          allKeywords.add(s.trim());
        }
      });
    }

    /* --------------------------------------------------
       🧹 Clean + limit
    -------------------------------------------------- */
    const limit = extended ? 40 : 10;
    const finalKeywords = Array.from(allKeywords).slice(0, limit);

    /* --------------------------------------------------
       ✅ GUARANTEED JSON RESPONSE (NEVER EMPTY)
    -------------------------------------------------- */
    return NextResponse.json({
      keywords: finalKeywords,
      mode: extended ? "extended" : "fast",
    });
  } catch (error) {
    console.error("❌ YouTube Suggest Fatal Error:", error);

    // 🔒 Absolute fallback — NEVER empty response
    return NextResponse.json(
      { keywords: [], error: "YouTube keyword fetch failed" },
      { status: 500 }
    );
  }
}

