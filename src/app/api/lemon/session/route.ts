import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/lemonsqueezy/create-session
 * Body: { plan: "pro" | "elite" }
 */
export async function POST(req: Request) {
  try {
    // Required in Next.js 15
    await cookies();

    // 🔐 Auth check
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse plan
    const { plan } = await req.json();
    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan name" },
        { status: 400 }
      );
    }

    // Choose correct product variant
    const productId =
      plan === "elite"
        ? process.env.LEMON_ELITE_PRODUCT_ID
        : process.env.LEMON_PRO_PRODUCT_ID;

    if (!productId) {
      throw new Error("Missing LemonSqueezy product ID in environment variables");
    }

    // 🍋 Prepare checkout body
    const body = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              plan,
              user_id: user.id, // store user in metadata 💾
            },
          },
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
        relationships: {
          store: {
            data: { type: "stores", id: process.env.LEMON_STORE_ID },
          },
          variant: {
            data: { type: "variants", id: productId },
          },
        },
      },
    };

    // 🍋 Call Lemon API
    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const url = data?.data?.attributes?.url;

    if (!url) {
      console.error("❌ Lemon checkout creation failed:", data);
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("❌ Lemon checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

