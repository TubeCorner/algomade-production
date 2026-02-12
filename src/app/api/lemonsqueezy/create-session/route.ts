import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // Required in Next.js 15 — prevents read-only cookies bug
    await cookies();

    // 🔐 Authenticate user
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();
    if (!plan) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    // 🍋 Lemon credentials
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const productId =
      plan === "elite"
        ? process.env.LEMONSQUEEZY_ELITE_PLAN_ID
        : process.env.LEMONSQUEEZY_PRO_PLAN_ID;

    if (!storeId || !apiKey || !productId) {
      return NextResponse.json(
        { error: "LemonSqueezy credentials not configured" },
        { status: 500 }
      );
    }

    // 🍋 Create checkout session
    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            custom_price: null,
            checkout_data: {
              custom: {
                plan,
                user_id: user.id, // 🔥 critical for webhook mapping
              },
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=true`,
            },
          },
          relationships: {
            store: { data: { type: "stores", id: storeId } },
            variant: { data: { type: "variants", id: productId } },
          },
        },
      }),
    });

    const data = await res.json();
    const url = data?.data?.attributes?.url;

    if (!url) {
      console.error("Lemon checkout failed:", data);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("❌ Lemon checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

