import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/auth";

/* 🟢 GET — Fetch trending keywords for project */
export async function GET(req: Request) {
  try {
    await cookies();

    const session = (await getServerSession(authOptions)) ;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();
    const url = new URL(req.url);
    const project_id = url.searchParams.get("project_id");

    if (!project_id) {
      return NextResponse.json(
        { error: "Missing project_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("trending_keywords")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("project_id", project_id)
      .order("velocity", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Trending list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ trends: data });
  } catch (err: any) {
    console.error("Trending list crash:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


