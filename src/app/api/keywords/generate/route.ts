import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { cookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    await cookies();

    const session = (await getServerSession(authOptions)) ;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { topic, query } = body;
    const actualTopic = topic || query;

    if (!actualTopic || actualTopic.trim() === "") {
      return NextResponse.json(
        { error: "Missing topic or query" },
        { status: 400 }
      );
    }

    const prompt = `
Generate 15 high-performing YouTube SEO keywords for the topic:
"${actualTopic}"

Rules:
- Return ONLY a comma-separated list
- No numbering
- No explanations
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || "";
    const keywords = text
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (!keywords.length) {
      return NextResponse.json(
        { error: "No keywords generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ keywords });
  } catch (err) {
    console.error("❌ AI Keyword Generation Error:", err);
    return NextResponse.json(
      { error: "Failed to generate keywords" },
      { status: 500 }
    );
  }
}

