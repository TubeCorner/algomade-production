"use client";

import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPage() {
  const { data: session, status } = useSession();

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      tagline: "Best for new creators testing the waters",
      features: [
        "Generate 10 YouTube keywords/day",
        "Basic trend insights",
        "Save keywords to projects",
        "Access dashboard analytics",
      ],
      cta: status === "authenticated" ? "Current Plan" : "Start Free",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "/month",
      tagline: "For creators ready to scale their content strategy",
      features: [
        "Unlimited AI keyword generation",
        "AI Keyword Generator Pro (long-tail)",
        "AI Thumbnail Ideas & Copy Generator",
        "Algorithm trend predictions",
        "Priority feature access",
        "Email support",
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
    },
    {
      name: "Elite",
      price: "$29",
      period: "/month",
      tagline: "For agencies & growth teams managing multiple channels",
      features: [
        "Everything in Pro +",
        "Team collaboration & multi-login",
        "Bulk keyword import/export",
        "Custom AI Thumbnail Templates",
        "Early access to beta tools",
        "Dedicated support channel",
      ],
      cta: "Go Elite",
      highlighted: false,
    },
  ];

  return (
    <main className="min-h-screen bg-[#0F172A] text-white pt-32 pb-24 px-6">
      {/* Header */}
      <div className="text-center mb-20">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Simple, Transparent Pricing
        </h1>
        <p className="text-gray-400 text-lg">
          Choose the plan that fits your creator journey.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col justify-between rounded-2xl border transition transform hover:scale-[1.02] duration-300 ${
              plan.highlighted
                ? "border-blue-500 bg-gradient-to-b from-blue-600/20 via-[#1E293B] to-[#0F172A] shadow-lg shadow-blue-500/30"
                : "border-gray-700 bg-[#1E293B] hover:border-blue-500/40"
            } p-8`}
          >
            <div>
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{plan.tagline}</p>

              <div className="flex items-end gap-1 mb-6">
                <span className="text-5xl font-extrabold text-white">
                  {plan.price}
                </span>
                <span className="text-gray-400 text-sm mb-2">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-gray-300 leading-relaxed"
                  >
                    <Check className="text-blue-400 w-5 h-5 mt-[2px]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <div className="mt-auto">
              <Button
                className={`w-full text-lg py-3 rounded-lg ${
                  plan.highlighted
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-300"
                }`}
                onClick={async () => {
                  if (plan.name === "Free") {
                    window.location.href = "/dashboard";
                    return;
                  }

                  if (status !== "authenticated") {
                    signIn("google");
                    return;
                  }

                  try {
                    const res = await fetch("/api/lemon/session", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        plan: plan.name.toLowerCase(), // "pro" or "elite"
                      }),
                    });

                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url; // redirect to Lemon checkout
                    } else {
                      alert("⚠️ Checkout unavailable — please try again later.");
                    }
                  } catch (err) {
                    console.error("Checkout error:", err);
                    alert("Something went wrong while creating checkout.");
                  }
                }}
              >
                {plan.cta}
              </Button>
            </div>

            {plan.highlighted && (
              <div className="absolute top-4 right-4 bg-blue-500 text-xs font-semibold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-20">
        <p className="text-gray-400 mb-4">
          Have a question about pricing or features?
        </p>
        <Link
          href="mailto:support@algomade.com"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Contact Support
        </Link>
      </div>
    </main>
  );
}
