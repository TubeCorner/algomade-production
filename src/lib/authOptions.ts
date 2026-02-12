import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import type { NextAuthOptions } from "next-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: { timeout: 10000 },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      const googleId = user.id;

      const { data } = await supabaseAdmin
        .from("user_id_map")
        .select("uuid")
        .eq("google_id", googleId)
        .maybeSingle();

      if (data?.uuid) {
        (user as any).id = data.uuid; // ✅ unified
        return true;
      }

      const { data: inserted, error } = await supabaseAdmin
        .from("user_id_map")
        .insert({ google_id: googleId })
        .select("uuid")
        .single();

      if (error) return false;

      (user as any).id = inserted.uuid; // ✅ unified
      return true;
    },

    async session({ session, token }) {
      // In the signIn callback above we overwrite `user.id` with the
      // unified UUID from `user_id_map`. NextAuth then persists that
      // value as `token.sub`, so by the time we are in the session
      // callback, `token.sub` is already your unified user id.
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

