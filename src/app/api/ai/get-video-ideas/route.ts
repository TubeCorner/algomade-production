// src/app/api/ai/get-video-ideas/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    await cookies(); // required for Next.js 15 API routes

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    // 🔐 AUTH via NextAuth (real user)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🟢 ADMIN CLIENT — bypass RLS safely
    let query = supabaseAdmin
      .from("video_ideas")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, count, error } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) throw error;

    return NextResponse.json({
      ideas: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err: any) {
    console.error("❌ get-video-ideas:", err.message || err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
