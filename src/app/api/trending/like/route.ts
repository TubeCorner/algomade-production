import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

/* 🟢 POST — Increment like on trending keyword */
export async function POST(req: Request) {
  try {
    await cookies();

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    const { error } = await supabase.rpc("increment_like_trending", {
      k_id: id,
    });

    if (error) {
      console.error("RPC failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Trending like error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

