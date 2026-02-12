// src/app/api/auth/sync/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Sync NextAuth user → Supabase profiles
 */
export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) ;
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email: session.user.email || null,
        name: session.user.name || null,
        image: session.user.image || null,
        plan: "free",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ /api/auth/sync failed:", err.message);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
