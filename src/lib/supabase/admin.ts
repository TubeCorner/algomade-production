// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Explicit admin client.
 * Same SERVICE ROLE key as server client, but used for cron jobs, scripts, etc.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

