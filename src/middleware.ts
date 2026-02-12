import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const token = (req as any).nextauth?.token;
    if (!token) return NextResponse.next();

    if (!pathname.startsWith("/pricing"))
      return NextResponse.next();

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const userId = token.sub;
      if (!userId) return NextResponse.next();

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .maybeSingle();

      const plan = profile?.plan || "free";

      if (["pro", "elite"].includes(plan)) {
        return NextResponse.redirect(
          new URL("/dashboard", req.url)
        );
      }

      return NextResponse.next();
    } catch (err) {
      console.error("Middleware error:", err);
      return NextResponse.next();
    }
  },
  {
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/pricing/:path*"],
};
