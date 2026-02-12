// src/lib/supabase/server.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 *
 * - Only ever used in server code (API routes, server actions)
 * - Never import this in client components.
 * - Bypasses RLS entirely.
 * - DO NOT use Supabase auth — NextAuth handles identity.
 */
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

