// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // Use JWT sessions (best for edge + serverless)
  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    /** -----------------------------------------
     * JWT callback (runs during login)
     * ---------------------------------------- */
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        // Google returns "sub" as the user ID
        token.id = user.id || user.sub || token.sub;
        token.email = user.email;
      }
      return token;
    },

    /** -----------------------------------------
     * Session callback (exposes to client)
     * ---------------------------------------- */
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};

