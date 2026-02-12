// src/app/api/ai/generate-meta/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* -------------------------------------------------------------------------- */
/* 🧠 POST — Generate 3 Titles + 3 Descriptions                               */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const keywords = Array.isArray(body?.keywords)
      ? body.keywords.filter((k: any) => typeof k === "string" && k.trim())
      : [];

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: "No valid keywords provided." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert YouTube SEO strategist.

Generate *exactly 3* catchy, high-CTR YouTube titles 
and *exactly 3* SEO-optimized video descriptions
based on these keywords:

"${keywords.join(", ")}"

STRICT RULES:
- Return ONLY valid JSON.
- NO commentary.
- NO explanations.
- NO extra keys.
- NO backticks.
- Titles must be 45–70 chars.
- Descriptions must be 80–200 chars.

FORMAT:
{
  "titles": ["t1", "t2", "t3"],
  "descriptions": ["d1", "d2", "d3"]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content || "";

    const parsed = strictJsonExtract(raw);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("❌ Meta generation error:", error.message);
    return NextResponse.json(
      { error: "Failed to generate meta content." },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* 🧩 JSON Extractor — 100% robust against messy AI output                    */
/* -------------------------------------------------------------------------- */
function strictJsonExtract(str: string) {
  try {
    // Remove Markdown, bullets, stray chars
    let cleaned = str
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/[\u0000-\u001F]+/g, "") // remove control chars
      .trim();

    // Extract the JSON object if text contains surrounding messages
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    const json = JSON.parse(cleaned);

    return {
      titles: Array.isArray(json?.titles) ? json.titles.slice(0, 3) : [],
      descriptions: Array.isArray(json?.descriptions)
        ? json.descriptions.slice(0, 3)
        : [],
    };
  } catch (err) {
    console.warn("⚠️ AI JSON parse failed → fallback", err);

    return {
      titles: ["Video Title Could Not Be Generated"],
      descriptions: ["Description parsing failed."],
    };
  }
}

