import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { createServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    await cookies(); // Next.js 15 requirement

    const session = (await getServerSession(authOptions)) ;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = await createServerSupabase();

    const url = new URL(req.url);

    // 🔥 FIX → Support BOTH project_id and projectId (frontend uses both)
    const projectId =
      url.searchParams.get("project_id") ||
      url.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("keyword_projects")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Fetch saved keywords error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✔ ALWAYS return array
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (err: any) {
    console.error("❌ GET saved keywords crash:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


