import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ⛔ Webhook must NOT use cookies — use direct server client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // full access — required for webhook
);

export async function POST(req: Request) {
  try {
    // 1️⃣ Read raw body (required for signature verification)
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

    // 2️⃣ Validate signature
    const hash = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== hash) {
      console.error("❌ Invalid webhook signature.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3️⃣ Parse webhook body
    const body = JSON.parse(rawBody);
    const event = body?.meta?.event_name;
    const attributes = body?.data?.attributes;
    const customData = attributes?.custom_data;

    const userId = customData?.user_id;  // 🔥 Your Lemon checkout stores this
    const plan = customData?.plan;       // "pro" or "elite"

    if (!userId) {
      console.error("❌ Missing user_id in webhook payload");
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    /* ---------------------------------------------------------------------- */
    /* 🔔 Handle Events                                                       */
    /* ---------------------------------------------------------------------- */

    // 📦 One-time purchase OR subscription creation
    if (event === "order_created" || event === "subscription_created") {
      await supabase
        .from("profiles")
        .update({
          plan: plan || "pro",
          upgraded_at: new Date().toISOString(),
        })
        .eq("id", userId);

      console.log(`✅ User upgraded: ${userId} → ${plan}`);
    }

    // 🔁 Subscription renewed / payment succeeded
    if (event === "subscription_payment_success" || event === "order_refunded") {
      // You can record billing history OR ignore
      console.log("💰 Payment success / renewed for user:", userId);
    }

    // 🧊 Subscription canceled
    if (event === "subscription_cancelled") {
      await supabase
        .from("profiles")
        .update({ plan: "free" })
        .eq("id", userId);

      console.log(`⚠️ Subscription cancelled for ${userId}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

