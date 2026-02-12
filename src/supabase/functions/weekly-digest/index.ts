import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServerSupabase } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";

serve(async () => {
  const supabase = createServerSupabase(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

  const { data: users } = await supabase.from("profiles").select("id, email, name");

  for (const user of users) {
    const { data: insights } = await supabase
      .from("keyword_rank_insights")
      .select("keyword, difficulty_score, recommended_action")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (!insights?.length) continue;

    const html = `
      <h2 style="font-family:sans-serif">Your Weekly Growth Digest 🚀</h2>
      <p>Hi ${user.name || "Creator"}, here are your top recent insights:</p>
      <ul>
        ${insights
          .map(
            (i) =>
              `<li><b>${i.keyword}</b> — ${i.recommended_action} (${i.difficulty_score}/100)</li>`
          )
          .join("")}
      </ul>
      <p>👉 Open your dashboard: <a href="https://algomade.com/dashboard">View Now</a></p>
    `;

    await resend.emails.send({
      from: "AlgoMade <digest@algomade.com>",
      to: user.email,
      subject: "🎯 Your Weekly Creator Growth Digest",
      html,
    });
  }

  return new Response("✅ Weekly Digest Sent", { status: 200 });
});

