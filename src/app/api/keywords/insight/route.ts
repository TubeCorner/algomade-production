import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import OpenAI from "openai";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const FREE_DAILY_LIMIT = 3;

export async function POST(req: Request) {
  try {
    await cookies();

    const { keyword, metrics } = await req.json();
    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const lowered = keyword.toLowerCase().trim();
    const supabase = await createServerSupabase();

    /* ---------------------------------------------
       AUTH — allow insight even if not logged in
    --------------------------------------------- */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? null; // ❗ anonymous → null

    /* -----------------------
       FREE LIMIT ENFORCEMENT
    ----------------------- */
    const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === "prod";
    if (isProd && userId) {
      const since = new Date(Date.now() - 86400000).toISOString();

      const { count } = await supabase
        .from("keyword_insights")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("generated_at", since);

      if ((count ?? 0) >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: "Free limit reached",
            message: "Upgrade to Pro for unlimited insights",
          },
          { status: 403 }
        );
      }
    }

    /* ---------------------------------------------
       CACHE READ (ONLY FOR LOGGED-IN USERS)
    --------------------------------------------- */
    if (userId) {
      const { data: existing } = await supabase
        .from("keyword_insights")
        .select("*")
        .eq("user_id", userId)
        .eq("keyword", lowered)
        .maybeSingle();

      if (
        existing &&
        Date.now() - new Date(existing.generated_at).getTime() < CACHE_TTL_MS
      ) {
        return NextResponse.json({
          keyword: lowered,
          insight: existing.insight,
          confidence: existing.confidence,
          model: existing.model,
          cached: true,
          generated_at: existing.generated_at,
        });
      }
    }

    /* ---------------------------------------------
       OPENAI PROMPT BUILD
    --------------------------------------------- */
    const m = metrics || {};
    const safeFix = (n: any) =>
      typeof n === "number" && !isNaN(n) ? n.toFixed(1) : "0.0";

    const contextLines = [
      m.velocity != null ? `Velocity%: ${safeFix(m.velocity)}` : null,
      m.trend7d != null ? `7d Avg: ${m.trend7d}` : null,
      m.trend30d != null ? `30d Avg: ${m.trend30d}` : null,
      m.yt_avg_views != null ? `Avg Views: ${m.yt_avg_views}` : null,
      m.yt_new_uploads != null ? `New Uploads (7d): ${m.yt_new_uploads}` : null,
    ].filter(Boolean).join(" | ");

    const systemMsg = `You are a YouTube keyword insight analyst.
Give short, actionable creator insights.
Return JSON only, no extra text.`;

    const userMsg = `Keyword: "${keyword}"
Context: ${contextLines || "no metrics"}
Return JSON:
{
  "summary": "",
  "why_now": "",
  "tips": "",
  "confidence": 0.0
}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
    });

    /* ---------------------------------------------
      PARSE OUTPUT
    --------------------------------------------- */
    let payload = {
      summary: "",
      why_now: "",
      tips: "",
      confidence: 0.6,
    };

    try {
      let text = completion.choices[0]?.message?.content?.trim() || "";

      if (text.startsWith("```")) {
        text = text
          .replace(/^```(json)?/i, "")
          .replace(/```$/, "")
          .trim();
      }

      const parsed = JSON.parse(text);
      payload = { ...payload, ...parsed };
    } catch (err) {
      console.warn("Insight JSON parse failed:", err);
      payload.summary =
        completion.choices[0]?.message?.content?.slice(0, 300) ||
        "Could not generate full insight.";
    }

    /* ---------------------------------------------
      CACHE WRITE (ONLY IF LOGGED IN)
    --------------------------------------------- */
    if (userId) {
      try {
        await supabaseAdmin.from("keyword_insights").upsert(
          {
            user_id: userId,
            keyword: lowered,
            insight: payload, // stored as JSONB, not stringified
            confidence: Number(payload.confidence ?? 0.6),
            model: "gpt-4o-mini",
            generated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,keyword" }
        );
      } catch (err) {
        console.error("Insight cache write failed:", err);
      }
    }

    return NextResponse.json({
      keyword: lowered,
      insight: payload,
      confidence: Number(payload.confidence ?? 0.6),
      model: "gpt-4o-mini",
      cached: false,
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Insight API error:", err?.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

