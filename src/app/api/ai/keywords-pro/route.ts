// src/app/api/ai/keywords-pro/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // Required for Next 15 dynamic APIs
    await cookies();

    const session = (await getServerSession(authOptions)) ;
    const userId = session?.user?.id;

    // ❗ Pro-only endpoint — block Free users
    const { data: userPlanRow } = await supabaseAdmin
  .from("user_plans")
  .select("plan")
  .eq("user_id", userId)
  .single();

const plan = userPlanRow?.plan ?? "free";

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (plan !== "pro") {
      return NextResponse.json(
        {
          success: false,
          error: "Pro feature locked",
          message: "Upgrade to AlgoMade Pro to generate advanced keywords.",
        },
        { status: 403 }
      );
    }

    /* -----------------------------------------
       Parse Input
    ----------------------------------------- */
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing topic" },
        { status: 400 }
      );
    }

    /* -----------------------------------------
       AI Prompt
    ----------------------------------------- */
    const prompt = `
Generate exactly 15 PRO-level long-tail YouTube keywords for: "${topic}"
Rules:
- 2–6 words each
- Highly searchable
- Reflect real user intent
- No hashtags, no numbering, no explanations
Return output as a *pure comma-separated list* only.
`;

    /* -----------------------------------------
       OpenAI Call
    ----------------------------------------- */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.75,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0]?.message?.content || "";
    const keywords = text
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      keywords,
      count: keywords.length,
    });
  } catch (err: any) {
    console.error("❌ keywords-pro error:", err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

