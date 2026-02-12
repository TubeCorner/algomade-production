// src/app/api/ai/generate-video-pack/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

/* -------------------------------------------------------------------------- */
/* 🧠 POST — Generate a YouTube "Video Idea Pack"                              */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();

    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return NextResponse.json(
        { error: "Keyword is required" },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    /* ---------------------------------------------------------------------- */
    /*  Prompt: structured, JSON enforced                                     */
    /* ---------------------------------------------------------------------- */
    const system = `
You are a YouTube growth strategist.

For a given keyword, generate a concise "Video Idea Pack" optimized for:
- high CTR
- strong hooks
- high retention
- punchy CTA

STRICT RULES:
- Return ONLY valid JSON (response_format = json_object)
- Titles must be 45–70 characters
- Description must be 120–160 characters
- No hashtags
- No markdown
- No extra commentary

Format:
{
  "titles": ["t1", "t2", "t3", "t4", "t5"],
  "hook": "text",
  "description": "text",
  "cta": "text"
}
`;

    const user = `Keyword: "${keyword}"`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    /* ---------------------------------------------------------------------- */
    /* Parse JSON output from OpenAI                                          */
    /* ---------------------------------------------------------------------- */
    let payload: any = {};
    try {
      const content = completion.choices[0]?.message?.content || "{}";
      payload = typeof content === "string" ? JSON.parse(content) : content;
    } catch (err) {
      console.warn("⚠️ AI JSON parsing failed:", err);
      payload = {};
    }

    /* ---------------------------------------------------------------------- */
    /*  Coerce the structure safely                                           */
    /* ---------------------------------------------------------------------- */
    const pack = {
      titles: Array.isArray(payload?.titles)
        ? payload.titles.slice(0, 5).map(String)
        : [],
      hook: typeof payload?.hook === "string" ? payload.hook : "",
      description:
        typeof payload?.description === "string" ? payload.description : "",
      cta: typeof payload?.cta === "string" ? payload.cta : "",
    };

    return NextResponse.json({ keyword, pack });
  } catch (err: any) {
    console.error("❌ /api/ai/generate-video-pack error:", err?.message || err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

