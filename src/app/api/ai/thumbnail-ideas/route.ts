// src/app/api/ai/thumbnail-ideas/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    await cookies(); // Next.js 15 requirement

    // 🔐 Auth (same pattern as all AI routes)
    const session = (await getServerSession(authOptions)) ;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { topic } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing topic" },
        { status: 400 }
      );
    }

    // 🎨 AI Prompt — strict structured response
    const system = `
You are an expert YouTube thumbnail strategist.
Generate 10 viral, emotional, curiosity-driven thumbnail text ideas (max 6 words).
Return STRICT JSON:
{ "ideas": ["...", "..."] }
`;

    const user = `Topic: "${topic}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    // Extract content safely
    const content = completion.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { ideas: [] };
    }

    // Final enforced structure
    const ideas = Array.isArray(parsed.ideas)
      ? parsed.ideas.map(String).slice(0, 10)
      : [];

    return NextResponse.json({
      success: true,
      ideas,
    });
  } catch (err: any) {
    console.error("❌ thumbnail-ideas:", err.message || err);
    return NextResponse.json(
      { success: false, error: "AI generation failed" },
      { status: 500 }
    );
  }
}

