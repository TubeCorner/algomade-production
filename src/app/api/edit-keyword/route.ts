import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { createServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  try {
    // Required for Next.js 15 (ensures cookies available)
    await cookies();

    // Create SSR Supabase client inside the handler
    const supabase = createServerSupabase();

    // Authentication
    const session = (await getServerSession(authOptions)) ;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Request body
    const { id, newKeyword } = await req.json();
    if (!id || !newKeyword) {
      return NextResponse.json(
        { error: "Missing keyword ID or new keyword value" },
        { status: 400 }
      );
    }

    // Edit keyword
    const { error } = await supabase
      .from("keywords")
      .update({ keyword: newKeyword })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("❌ Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


