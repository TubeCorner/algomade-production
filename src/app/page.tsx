"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  /* ============================================================= */
  /* STATE + DATA                                                  */
  /* ============================================================= */

  // Scroll progress
  const [scrollProgress, setScrollProgress] = useState(0);

  // Testimonials
  const testimonials = [
    {
      name: "Ravi Sharma",
      role: "Tech YouTuber, India",
      feedback:
        "AlgoMade changed how I plan content. The AI Keyword Generator is scary accurate!",
      avatar: "/avatars/user1.png",
    },
    {
      name: "Emily Carter",
      role: "Gaming Creator, UK",
      feedback: "The trend prediction tool is pure gold!",
      avatar: "/avatars/user2.png",
    },
    {
      name: "Luis Fernandez",
      role: "Marketing Strategist, Spain",
      feedback: "A must-have for YouTube pros — simple, beautiful, smart.",
      avatar: "/avatars/user3.png",
    },
    {
      name: "Aisha Noor",
      role: "Lifestyle Vlogger, UAE",
      feedback: "Thumbnail ideas are incredible — real CTR boost!",
      avatar: "/avatars/user4.png",
    },
    {
      name: "Daniel Kim",
      role: "Education Channel, US",
      feedback:
        "Insights improved my content strategy faster than any other tool.",
      avatar: "/avatars/user5.png",
    },
  ];

  const trendingKeywords = [
    "low competition niche ideas",
"how to grow from 1k to 10k subs",
"faceless channel ideas",
"youtube shorts growth 2026",
    "study motivation",
    "thumbnail ideas",
    "keyword research",
    "gaming highlights",
    "how to grow on youtube",
    "youtube shorts boost",
    "mr beast style ideas",
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [email, setEmail] = useState("");
const [emailSubmitted, setEmailSubmitted] = useState(false);

  /* ============================================================= */
  /* EFFECTS                                                       */
  /* ============================================================= */

  // Redirect logged-in users
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  // Reveal animations
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("reveal-visible");
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => els.forEach((el) => obs.unobserve(el));
  }, []);

  // Scroll progress bar
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
      setScrollProgress(progress);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-gray-400">
        Checking session...
      </div>
    );
  }

  /* ============================================================= */
  /* TESTIMONIAL INDEX CALC                                        */
  /* ============================================================= */
  const visibleIndexes = [
    (activeTestimonial + testimonials.length - 1) % testimonials.length,
    activeTestimonial,
    (activeTestimonial + 1) % testimonials.length,
  ];

  /* ============================================================= */
  /* PAGE JSX                                                      */
  /* ============================================================= */

  return (
    <main className="bg-[#0B0F19] text-white min-h-screen flex flex-col relative">
      {/* Scroll Progress Bar */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ============================================================= */}
      {/* HERO SECTION — Premium + Live Trend Strip                     */}
      {/* ============================================================= */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-[-260px] left-1/2 -translate-x-1/2 w-[750px] h-[750px] bg-[rgba(255,200,0,0.07)] blur-[180px]" />
          <div className="absolute bottom-[-240px] right-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[rgba(0,140,255,0.07)] blur-[170px]" />

          {/* Floating icons */}
          <div className="float-icon float-icon-1">▶</div>
          <div className="float-icon float-icon-2">✨</div>
          <div className="float-icon float-icon-3">📈</div>
          <div className="float-icon float-icon-4">🔍</div>
        </div>

        {/* HERO TEXT */}
<div className="relative max-w-4xl mx-auto text-center z-[10]">
  <p className="text-amber-300 text-sm mb-4 fade-up">
    For creators stuck under 10,000 subscribers
  </p>

  <h1 className="text-4xl md:text-6xl font-bold leading-tight fade-up [animation-delay:0.1s]">
    Stuck Under 10k Subscribers?
    <br className="hidden md:block" />
    Stop Guessing What to Post.
  </h1>

  <p className="text-gray-300 max-w-2xl mx-auto mt-6 text-lg fade-up [animation-delay:0.2s]">
    AlgoMade finds low-competition topics with rising search velocity{" "}
    <span className="text-white font-semibold"> </span>
    {" "}— so smaller creators can publish before bigger channels dominate them.{" "}
    <span className="text-white font-semibold">now</span>,
    Designed specifically for growing YouTube channels.
  </p>

  {/* PRIMARY CTA — EMAIL FIRST */}
  {!emailSubmitted ? (
    <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 fade-up [animation-delay:0.3s]">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email to start free"
        className="px-5 py-3 rounded-lg bg-[#111827] border border-white/10 text-white w-full sm:w-[320px] focus:outline-none focus:border-amber-400"
      />

      <button
  onClick={async () => {
    if (!email) return;

    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setEmailSubmitted(true);
    } catch (err) {
      console.error("Waitlist error", err);
    }
  }}
  className="px-8 py-3 text-lg rounded-lg bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-all"
>
  Start Free
</button>

    </div>
  ) : (
    <p className="mt-8 text-green-400 fade-up">
      ✅ You’re on the list. Early access coming soon.
    </p>
  )}

  {/* SECONDARY CTA — DOWNGRADED */}
  <div className="mt-6 fade-up [animation-delay:0.35s]">
    <button
      onClick={() => signIn("google")}
      className="text-sm text-blue-300 hover:text-blue-200 underline underline-offset-4"
    >
      Or sign in with Google
    </button>
  </div>

  <p className="text-gray-500 text-sm mt-4 fade-up [animation-delay:0.4s]">
    No spam • No credit card • Built for creators
  </p>

  {/* KEEP MARQUEE BELOW — DO NOT TOUCH */}

  {/* ============================================================= */}
  {/* PREMIUM LIVE TREND MARQUEE                                   */}
  {/* ============================================================= */}
  <div className="mt-12 marquee-wrapper fade-up [animation-delay:0.45s]">

    {/* Glow behind strip */}
    <div className="marquee-glow"></div>

    {/* Left + Right fade masks */}
    <div className="marquee-mask-left"></div>
    <div className="marquee-mask-right"></div>

    {/* Track content */}
    <div className="marquee-track">
      {trendingKeywords.map((kw, i) => (
        <span key={`t1-${i}`} className="marquee-item">
          🔥 {kw}
        </span>
      ))}
      {trendingKeywords.map((kw, i) => (
        <span key={`t2-${i}`} className="marquee-item">
          🔥 {kw}
        </span>
      ))}
    </div>

  </div>
</div>

        {/* MacBook Hero Image */}
        <div className="mt-14 flex justify-center relative z-[10]">
          <div className="relative w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl shadow-black/40 float-mockup mockup-hover">
            <div className="absolute inset-0 bg-blue-400/8 blur-xl pointer-events-none" />
            <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_40px_rgba(0,0,0,0.35)] pointer-events-none" />

            <Image
              src="/mockup-dashboard.png"
              alt="AlgoMade Dashboard Preview"
              width={1600}
              height={900}
              className="w-full h-auto block"
              priority
            />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-[1px] w-full bg-white/5 my-12" />

      {/* ============================================================= */}
      {/* HOW IT WORKS                                                 */}
      {/* ============================================================= */}
      <section className="py-28 bg-[#0F172A] relative overflow-hidden reveal">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#101624] to-[#0B0F19] opacity-60" />

        <div className="relative max-w-6xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-6 fade-up">
            How AlgoMade Works
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto text-lg fade-up [animation-delay:0.1s]">
            No complicated setup. AlgoMade works behind the scenes to surface
            what truly grows your channel.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mt-16 fade-up [animation-delay:0.2s]">
            {[
              {
                step: "01",
                title: "Connect with Google",
                desc: "Instant access to your creator dashboard — no setup required.",
                icon: "🔗",
              },
              {
                step: "02",
                title: "Generate Insights",
                desc: "Real-time YouTube data + AI work together to reveal powerful opportunities.",
                icon: "⚡",
              },
              {
                step: "03",
                title: "Grow Smarter",
                desc: "Optimize with exact keywords, trends, and thumbnails that drive views.",
                icon: "🚀",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group p-8 bg-[#0F172A]/80 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/10 transition-all relative"
              >
                <div className="text-5xl absolute top-4 left-4 text-gray-700 opacity-10 font-bold">
                  {item.step}
                </div>
                <div className="text-4xl mb-6 text-amber-300 drop-shadow">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
                <div className="h-[2px] w-0 group-hover:w-full bg-amber-400/60 mt-6 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-[1px] w-full bg-white/5 my-24" />
{/* ============================================================= */}
{/* MINI DEMO — Neon Glass 3-Step Micro Preview (E2-B)            */}
{/* ============================================================= */}
<section className="py-24 bg-[#0F172A] relative overflow-hidden reveal">
  {/* Glow background */}
  <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#101624] to-[#0B0F19] opacity-60" />

  <div className="relative max-w-6xl mx-auto px-6 text-center">
    <h2 className="text-3xl font-bold mb-6 fade-up">See AlgoMade in Action</h2>
    <p className="text-gray-400 text-lg max-w-2xl mx-auto fade-up [animation-delay:0.1s]">
      Type anything and preview how AlgoMade analyzes topics instantly.
    </p>

    {/* Fake Input Bar + Button */}
    <div className="mt-10 fade-up [animation-delay:0.2s] flex justify-center">
      <div className="max-w-xl w-full bg-[#1A2234]/60 backdrop-blur-md rounded-xl border border-white/10 p-3 flex items-center gap-3 neon-input">
        <span className="text-gray-400">🔍</span>
        <input
          disabled
          type="text"
          className="bg-transparent outline-none text-gray-300 w-full"
          placeholder="Try: How to grow YouTube fast"
        />
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm shadow hover:scale-[1.03] transition">
          Analyze
        </button>
      </div>
    </div>

    {/* DEMO CARDS */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 fade-up [animation-delay:0.3s]">
      {[
        {
          icon: "📈",
          title: "Trend Curve",
          desc: "Traffic rising +18% this week. Ideal posting window ahead.",
          glow: "from-blue-400/30 to-blue-600/10",
        },
        {
          icon: "🎯",
          title: "Keyword Score",
          desc: "Competition remains low — high ranking opportunity.",
          glow: "from-amber-400/30 to-orange-600/10",
        },
        {
          icon: "💡",
          title: "Content Angle",
          desc: "Try: 'Beginner-friendly tutorial with examples'.",
          glow: "from-purple-400/30 to-pink-600/10",
        },
      ].map((card, i) => (
        <div
          key={i}
          className="
            group p-6 rounded-2xl relative
            bg-[#131B2A]/70 backdrop-blur-md
            border border-white/10
            hover:border-amber-400/40 transition-all
            neon-demo-card
          "
        >
          <div
            className={`
              absolute inset-0 rounded-2xl opacity-25 blur-2xl
              bg-gradient-to-br ${card.glow}
            `}
          ></div>
          <div className="relative text-3xl mb-4">{card.icon}</div>
          <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
          <p className="text-gray-400 text-sm">{card.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* ============================================================= */}
      {/* AI FEATURES                                                  */}
      {/* ============================================================= */}
      <section className="py-28 bg-[#0F172A] relative overflow-hidden reveal">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#101624] to-[#0B0F19] opacity-70" />

        <div className="relative max-w-6xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-6 fade-up">
            AI Tools That Work for You
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto text-lg fade-up [animation-delay:0.1s]">
          Find topics with rising search velocity before big channels dominate them.
          
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mt-16 fade-up [animation-delay:0.2s]">
            {[
              {
                icon: "🔍",
                title: "AI Keyword Intelligence",
                desc: "Uncover high-value, low-competition topics instantly.",
                gradient: "from-blue-500/20 to-blue-700/10",
              },
              {
                icon: "📈",
                title: "Trend Predictor",
                desc: "Predict emerging topics before they peak.",
                gradient: "from-green-400/20 to-emerald-600/10",
              },
              {
                icon: "🎨",
                title: "AI Thumbnail Studio",
                desc: "Generate click-worthy thumbnails with psychology-backed ideas.",
                gradient: "from-pink-500/20 to-purple-600/10",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-[#131B2A]/80 backdrop-blur-sm border border-white/10 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/10 transition-all relative"
              >
                <div
                  className={`absolute top-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full opacity-30 blur-2xl bg-gradient-to-br ${f.gradient}`}
                />
                <div className="relative text-5xl mb-6 drop-shadow">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
                <div className="h-[2px] w-0 group-hover:w-full bg-amber-400/40 mt-6 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================= */}
{/* FOUNDING CREATORS INVITE                                       */}
{/* ============================================================= */}
<section className="py-24 bg-[#111827] text-center relative overflow-hidden reveal">
  <div className="max-w-4xl mx-auto px-6">

    <h2 className="text-3xl font-bold mb-6">
      We’re Building This With 20 Serious Creators
    </h2>

    <p className="text-gray-400 text-lg mb-10">
      AlgoMade is currently in focused beta for creators under 10k subscribers.
      We're onboarding a small group who want early access, direct founder support,
      and lifetime discounted pricing.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">

      {[
        {
          icon: "⚡",
          title: "Direct Access",
          desc: "Talk directly with the founder and influence the roadmap."
        },
        {
          icon: "💎",
          title: "Lifetime Founder Pricing",
          desc: "Lock in the lowest price before public rollout."
        },
        {
          icon: "🚀",
          title: "Early Growth Advantage",
          desc: "Use trend velocity tools before competitors catch up."
        }
      ].map((item, i) => (
        <div
          key={i}
          className="p-8 rounded-2xl bg-[#0F172A]/70 border border-white/10 hover:border-amber-400/40 transition-all"
        >
          <div className="text-4xl mb-4">{item.icon}</div>
          <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
          <p className="text-gray-400 text-sm">{item.desc}</p>
        </div>
      ))}

    </div>

    <div className="mt-12">
      <button
        onClick={() => signIn("google")}
        className="px-8 py-3 text-lg rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-600/20 transition-all"
      >
        🚀 Become a Founding Creator
      </button>
    </div>

    <p className="text-gray-500 text-sm mt-6">
      Limited to 20 active creators.
    </p>

  </div>
</section>

      {/* Divider */}
      <div className="h-[1px] w-full bg-white/5 my-24" />
      

{/* ============================================================= */}
{/* WHO ALGOMADE IS PERFECT FOR                                   */}
{/* ============================================================= */}
<section className="py-24 bg-[#0F172A] relative overflow-hidden reveal">
  <div className="absolute inset-0 bg-gradient-to-b from-[#101624] to-[#0B0F19] opacity-60" />

  <div className="relative max-w-6xl mx-auto px-6 text-center">
    <h2 className="text-3xl font-bold mb-6 fade-up">
      Who AlgoMade Is Perfect For
    </h2>

    <p className="text-gray-400 text-lg max-w-2xl mx-auto fade-up [animation-delay:0.1s]">
      Designed specifically for growing creators who need clarity, not complexity.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-14 fade-up [animation-delay:0.2s]">

      {[
        {
          icon: "🚀",
          title: "Creators Under 10k Subs",
          desc: "Find topics you can actually rank for before bigger channels dominate them."
        },
        {
          icon: "🎬",
          title: "Shorts Creators",
          desc: "Spot rising trends early and publish during peak velocity."
        },
        {
          icon: "📚",
          title: "Educational Channels",
          desc: "Discover high-demand learning topics with lower competition."
        },
        {
          icon: "🤖",
          title: "Faceless AI Channels",
          desc: "Generate scalable niche ideas backed by real search data."
        }
      ].map((item, i) => (
        <div
          key={i}
          className="p-8 rounded-2xl bg-[#111827]/60 border border-white/10 hover:border-amber-400/40 transition-all"
        >
          <div className="text-4xl mb-4">{item.icon}</div>
          <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
          <p className="text-gray-400 text-sm">{item.desc}</p>
        </div>
      ))}

    </div>
  </div>
</section>
      {/* ============================================================= */}
      {/* FINAL CTA                                                    */}
      {/* ============================================================= */}
      <section className="py-28 bg-gradient-to-b from-[#0F172A] via-[#101624] to-[#0B0F19] text-center relative overflow-hidden reveal">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[rgba(255,200,0,0.05)] blur-[160px]" />
          <div className="absolute bottom-[-180px] right-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[rgba(0,140,255,0.07)] blur-[150px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6 fade-up">
            Start Growing with AI — Today
          </h2>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 fade-up [animation-delay:0.1s]">
            Join our first 50 founding creators.
            and stay ahead — without guesswork.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-up [animation-delay:0.2s]">
            <button
              onClick={() => signIn("google")}
              className="px-8 py-3 text-lg rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-600/20 transition-all"
            >
              🚀 Get Started Free
            </button>

            <Link href="/pricing">
              <button className="px-8 py-3 text-lg rounded-xl border border-blue-400 text-blue-300 hover:bg-blue-500/10 transition-all">
                💎 View Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* FOOTER                                                       */}
      {/* ============================================================= */}
      <footer className="py-14 text-sm text-gray-400 text-center border-t border-white/10 bg-[#0B0F19] relative reveal">
        <div className="footer-glow"></div>
        <div className="max-w-4xl mx-auto footer-links">
          <p>
            © {new Date().getFullYear()} AlgoMade — Built for Creators, Powered
            by AI.
          </p>

          <div className="flex justify-center gap-6 mt-4 text-[13px]">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>

          <p className="text-[11px] text-gray-600 mt-4">
            Made with ❤️ in India
          </p>
        </div>
      </footer>
    </main>
  );
}
