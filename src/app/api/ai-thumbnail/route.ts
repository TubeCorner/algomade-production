// src/app/api/ai-thumbnail/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Model used: gpt-image-1
 * Generates a 1536x1024 thumbnail and (optionally) uploads to Supabase.
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const topic = (body.topic || body.prompt || "").trim();
    const style =
      (body.style ||
        "clean, bold, high-contrast, creator-friendly, deep navy + amber accents")?.trim();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Missing 'topic' in request body." },
        { status: 400 }
      );
    }

    /* ------------------------------------
     * 1) Build OpenAI Image Prompt
     * ------------------------------------ */
    const prompt = [
      `Create a high-conversion YouTube thumbnail about: "${topic}".`,
      `Style: ${style}.`,
      `1280×720, 16:9 ratio.`,
      `High contrast. Clear focal point. Space for 2–4 word headline.`,
      `No watermarks, no logos.`,
    ].join(" ");

    /* ------------------------------------
     * 2) Generate thumbnail via OpenAI
     * ------------------------------------ */
    const aiRes = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",
    });

    const output = aiRes?.data?.[0];
    if (!output) {
      return NextResponse.json(
        { success: false, error: "OpenAI returned no image." },
        { status: 500 }
      );
    }

    const base64 = output.b64_json ?? null;
    const urlFromOpenAI = output.url ?? null;

    // If OpenAI returned a hosted URL, no need to upload
    if (urlFromOpenAI) {
      return NextResponse.json({
        success: true,
        url: urlFromOpenAI,
        source: "openai",
      });
    }

    if (!base64) {
      return NextResponse.json(
        { success: false, error: "No b64 JSON returned from OpenAI." },
        { status: 500 }
      );
    }

    /* ------------------------------------
     * 3) Upload to Supabase Storage (optional)
     * ------------------------------------ */

    const buffer = Buffer.from(base64, "base64");
    const supabase = supabaseAdmin; // ✅; // uses service key, safe for uploads

    const filename = `thumbnails/thumbnail-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("public") // bucket must exist
      .upload(filename, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);

      // Fallback: return base64 instead
      return NextResponse.json({
        success: true,
        image: `data:image/png;base64,${base64}`,
        note: "Returned base64 (upload failed).",
      });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("public").getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      supabasePath: filename,
      source: "supabase",
    });
  } catch (err: any) {
    console.error("ai-thumbnail error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

