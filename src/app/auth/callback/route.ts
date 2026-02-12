// src/app/auth/callback/route.ts

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (code) {
      // Create SSR Supabase correctly
      const supabase = await createServerSupabase();

      // Exchange OAuth code → Supabase session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("❌ Supabase OAuth exchange failed:", error);
      }
    }

    // Redirect user to dashboard after login
    return NextResponse.redirect(new URL("/dashboard", request.url));

  } catch (err: any) {
    console.error("❌ OAuth callback error:", err?.message);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

