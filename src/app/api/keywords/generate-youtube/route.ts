import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkPlanLimit } from "@/lib/checkPlanLimit";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // Required for Next.js 15
    await cookies();

    /* ----------------------------------------------------------
       1️⃣ Check plan + usage limits
    ----------------------------------------------------------- */
    const { allowed, message, plan, daily_keyword_count, userId } =
      await checkPlanLimit();

    if (!allowed) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    /* ----------------------------------------------------------
       2️⃣ Parse input
    ----------------------------------------------------------- */
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    /* ----------------------------------------------------------
       3️⃣ Fetch YouTube suggestion results
    ----------------------------------------------------------- */
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
      topic
    )}`;

    const res = await fetch(url, {
      headers: { "Accept-Language": "en-US,en;q=0.9" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "YouTube API request failed" },
        { status: res.status }
      );
    }

    /* ----------------------------------------------------------
       4️⃣ Parse the suggestion result (dirty JSON)
    ----------------------------------------------------------- */
    const rawText = await res.text();
    let parsed: any = null;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\[.*\]/s);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed || !Array.isArray(parsed) || !Array.isArray(parsed[1])) {
      return NextResponse.json(
        { error: "Invalid YouTube suggest format" },
        { status: 400 }
      );
    }

    /* ----------------------------------------------------------
       5️⃣ Extract clean suggestions
    ----------------------------------------------------------- */
    const suggestions: string[] = parsed[1]
      .map((item: any) =>
        typeof item === "string"
          ? item
          : Array.isArray(item)
          ? item[0]
          : null
      )
      .filter((s): s is string => !!s?.trim())
      .map((s) => s.trim())
      .slice(0, 20);

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: "No suggestions found" },
        { status: 404 }
      );
    }

    /* ----------------------------------------------------------
       6️⃣ Increment free plan usage (MUST USE ADMIN CLIENT)
    ----------------------------------------------------------- */
    if (userId && plan === "free") {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabaseAdmin
        .from("profiles")
        .update({ daily_keyword_count: daily_keyword_count + 1 })
        .eq("id", userId);
    }

    /* ----------------------------------------------------------
       🎉 Return final suggestions
    ----------------------------------------------------------- */
    return NextResponse.json({ keywords: suggestions });
  } catch (error: any) {
    console.error("❌ YouTube Suggest API failed:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch YouTube suggestions" },
      { status: 500 }
    );
  }
}

