// src/app/api/ai/generate-keywords/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";
import { checkPlanLimit } from "@/lib/checkPlanLimit";
import { supabaseAdmin } from "@/lib/supabase/admin"; // Admin client (bypasses RLS)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // Required for Next.js 15 (hydrates cookies for Supabase auth)
    await cookies();

    /* --------------------------------------------------------
       1️⃣ Check plan + daily rate limits
    --------------------------------------------------------- */
    const { allowed, message, plan, daily_keyword_count, userId } =
      await checkPlanLimit();

    if (!allowed) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    /* --------------------------------------------------------
       2️⃣ Parse and validate request body
    --------------------------------------------------------- */
    const { topic, limit = 20 } = await req.json();

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const cleanTopic = topic.trim();
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50); // limit: 1–50

    /* --------------------------------------------------------
       3️⃣ AI Prompt — Optimized for clean output
    --------------------------------------------------------- */
    const prompt = `
Generate ${safeLimit} highly searchable YouTube keyword ideas for the topic "${cleanTopic}".
Rules:
- Each keyword must be 1–4 words.
- Must be specific, trending, and YouTube-friendly.
- Do NOT include numbering, bullets, or extra text.
- Return ONLY a comma-separated list of keywords.
`;

    /* --------------------------------------------------------
       4️⃣ OpenAI keyword generation
    --------------------------------------------------------- */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert in YouTube keyword trends and SEO." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    let raw = completion.choices[0].message?.content ?? "";

    // Remove common formatting issues
    raw = raw
      .replace(/\n/g, ",")
      .replace(/•/g, ",")
      .replace(/-/g, ",")
      .replace(/\s+/g, " ")
      .trim();

    const keywords = raw
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .slice(0, safeLimit);

    /* --------------------------------------------------------
       5️⃣ Update daily usage — only for FREE plan
       Uses supabaseAdmin (bypasses RLS safely)
    --------------------------------------------------------- */
    if (userId && plan === "free") {
      await supabaseAdmin
        .from("profiles")
        .update({ daily_keyword_count: daily_keyword_count + 1 })
        .eq("id", userId);
    }

    /* --------------------------------------------------------
       6️⃣ Return response
    --------------------------------------------------------- */
    return NextResponse.json({ keywords });
  } catch (error: any) {
    console.error("❌ AI Keyword generation failed:", error.message);
    return NextResponse.json(
      { error: "Failed to generate keywords" },
      { status: 500 }
    );
  }
}

