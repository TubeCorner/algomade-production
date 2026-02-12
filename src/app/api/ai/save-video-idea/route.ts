// src/app/api/ai/save-video-idea/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin"; // correct admin client

export async function POST(req: Request) {
  try {
    await cookies(); // Required for Next.js 15 hydration

    /* --------------------------------------
       1️⃣ Auth (NextAuth only)
    --------------------------------------- */
    const session = (await getServerSession(authOptions)) ;
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* --------------------------------------
       2️⃣ Parse request body
    --------------------------------------- */
    const { keyword, project_id, title, hook, description, cta } =
      await req.json();

    if (!keyword || !project_id) {
      return NextResponse.json(
        { error: "Keyword and project_id are required" },
        { status: 400 }
      );
    }

    /* --------------------------------------
       3️⃣ Confirm project belongs to this user
    --------------------------------------- */
    const { data: project, error: projectErr } = await supabaseAdmin
      .from("projects")
      .select("user_id")
      .eq("id", project_id)
      .single();

    if (projectErr) {
      return NextResponse.json(
        { error: "Project lookup failed" },
        { status: 500 }
      );
    }

    if (!project || project.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this project" },
        { status: 403 }
      );
    }

    /* --------------------------------------
       4️⃣ Insert video idea (Admin bypasses RLS)
    --------------------------------------- */
    const { data, error } = await supabaseAdmin
      .from("video_ideas")
      .insert({
        user_id: userId,
        project_id,
        keyword,
        title: title || "",
        hook: hook || "",
        description: description || "",
        cta: cta || "",
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      idea: data,
    });
  } catch (err: any) {
    console.error("❌ save-video-idea error:", err.message || err);
    return NextResponse.json(
      { error: "Failed to save video idea" },
      { status: 500 }
    );
  }
}

