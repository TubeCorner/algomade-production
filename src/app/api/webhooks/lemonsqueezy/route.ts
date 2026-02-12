import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * LemonSqueezy Webhook (Subscription Events)
 * Validates signature + updates user plan in Supabase.
 */
export async function POST(req: Request) {
  try {
    // Read raw body (string, not JSON)
    const raw = await req.text();

    // Validate webhook signature
    const sig = req.headers.get("x-signature");
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
    const hmac = crypto.createHmac("sha256", secret).update(raw).digest("hex");

    if (!sig || sig !== hmac) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(raw);
    const eventType = body?.meta?.event_name;
    const email = body?.data?.attributes?.user_email;
    const variantName = body?.data?.attributes?.variant_name || "";

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // Admin client (SERVICE ROLE)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    );

    /* ---------------------------------------------------------------------- */
    /* 🔍 Determine Plan From Variant Name                                    */
    /* ---------------------------------------------------------------------- */
    const name = variantName.toLowerCase();
    let plan: "free" | "pro" | "elite" = "free";

    if (name.includes("elite")) plan = "elite";
    else if (name.includes("pro")) plan = "pro";

    /* ---------------------------------------------------------------------- */
    /* 🚀 subscription_created / updated                                      */
    /* ---------------------------------------------------------------------- */
    if (eventType === "subscription_created" || eventType === "subscription_updated") {
      const { error } = await supabase
        .from("profiles")
        .update({ plan })
        .eq("email", email);

      if (error) throw error;

      console.log(`✅ UPDATED PLAN → ${plan} for ${email}`);
    }

    /* ---------------------------------------------------------------------- */
    /* ❌ subscription_canceled                                               */
    /* ---------------------------------------------------------------------- */
    if (eventType === "subscription_canceled") {
      const { error } = await supabase
        .from("profiles")
        .update({ plan: "free" })
        .eq("email", email);

      if (error) throw error;

      console.log(`⚠️ CANCELED → plan reset to free for ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ LemonSqueezy Webhook Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

