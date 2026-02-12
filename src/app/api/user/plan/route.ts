// src/app/api/user/plan/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

/* 🟢 GET — Return user's plan safely */
export async function GET() {
  try {
    await cookies(); // required for Next.js 15

    const session = (await getServerSession(authOptions)) ;
    const userId = session?.user?.id;

    // not logged in → free
    if (!userId) {
      return NextResponse.json({ plan: "free" });
    }

    const supabase = await createServerSupabase();

    // ❗ Use maybeSingle() instead of single()
    // prevents: "Cannot coerce the result to a single JSON object"
    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("⚠️ Plan lookup error:", error.message);
      return NextResponse.json({ plan: "free" });
    }

    // If profile row doesn't exist → default free
    const plan = data?.plan || "free";

    return NextResponse.json({ plan });
  } catch (err: any) {
    console.error("❌ Plan fetch failed:", err.message);
    return NextResponse.json({ plan: "free" });
  }
}
