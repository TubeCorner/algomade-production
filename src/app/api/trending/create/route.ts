import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    await cookies();

    const session = (await getServerSession(authOptions)) ;
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { keyword, project_id } = await req.json();
    if (!keyword || !project_id)
      return NextResponse.json(
        { error: "keyword and project_id are required" },
        { status: 400 }
      );

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("trending_keywords")
      .insert([
        {
          user_id: session.user.id,
          project_id,
          keyword,
          trend_7d: 0,
          trend_30d: 0,
          velocity: 0,
          yt_avg_views: 0,
          yt_new_uploads: 0,
          opportunity_score: 0,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


