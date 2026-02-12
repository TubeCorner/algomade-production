// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* -------------------------------------------------------------------------- */
/* ⚙️ Environment Variables                                                   */
/* -------------------------------------------------------------------------- */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL =
  Deno.env.get("FROM_EMAIL") || "AlgoMade <no-reply@algomade.app>";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* -------------------------------------------------------------------------- */
/* 🧮 Helpers                                                                 */
/* -------------------------------------------------------------------------- */
function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  try {
    return Number(n).toLocaleString();
  } catch {
    return String(n);
  }
}

/* -------------------------------------------------------------------------- */
/* 🎨 Email Template                                                          */
/* -------------------------------------------------------------------------- */
function renderEmailHTML(user: any, rows: any[], start: Date, end: Date) {
  const items = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid var(--border);">${r.keyword}</td>
        <td style="padding:8px 12px;text-align:center;border-bottom:1px solid var(--border);color:#60a5fa;">${r.difficulty_score ?? "—"}</td>
        <td style="padding:8px 12px;text-align:right;border-bottom:1px solid var(--border);">${fmt(
          r.avg_views
        )}</td>
        <td style="padding:8px 12px;text-align:right;border-bottom:1px solid var(--border);">${fmt(
          r.avg_subs
        )}</td>
      </tr>`
    )
    .join("");

  const highlights = rows
    .slice(0, 3)
    .map(
      (r) =>
        `<li style="margin:4px 0;">🎯 <strong>${r.keyword}</strong> — ${
          r.recommended_action ?? "No action available"
        }</li>`
    )
    .join("");

  const dateRange = `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;

  return `
<!doctype html>
<html>
  <head>
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
      :root {
        color-scheme: light dark;
        --bg: #0f172a;
        --bg-alt: #111827;
        --border: #1f2937;
        --text: #e2e8f0;
        --muted: #9ca3af;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --bg: #ffffff;
          --bg-alt: #f9fafb;
          --border: #e5e7eb;
          --text: #1e293b;
          --muted: #475569;
        }
      }
    </style>
  </head>
  <body style="font-family:'Inter',system-ui,Segoe UI,Roboto,Arial,sans-serif;background-color:var(--bg);color:var(--text);margin:0;padding:0;">
    <div style="max-width:680px;margin:24px auto;background:var(--bg-alt);border:1px solid var(--border);border-radius:16px;overflow:hidden;">

      <!-- Header -->
      <div style="background:linear-gradient(90deg,#1e3a8a,#1e40af);padding:20px 24px;display:flex;align-items:center;gap:12px;">
        <img src="https://algomade.vercel.app/icon.png" alt="AlgoMade" width="36" height="36" style="border-radius:8px;">
        <div>
          <h2 style="margin:0;color:#f9fafb;font-size:20px;">AlgoMade Weekly Digest</h2>
          <p style="margin:2px 0 0;color:#cbd5e1;font-size:13px;">Hi ${
            user.full_name ?? "Creator"
          }, here’s your performance snapshot (${dateRange})</p>
        </div>
      </div>

      <!-- Highlights -->
      <div style="padding:20px 24px 10px;">
        <h3 style="margin:0 0 8px;color:#93c5fd;font-size:16px;">Top Highlights 🚀</h3>
        <ul style="margin:0 0 16px;padding-left:18px;color:var(--text);font-size:14px;line-height:1.6;">
          ${highlights || "<li>No major insights this week — keep creating!</li>"}
        </ul>
      </div>

      <!-- Insights Table -->
      <div style="padding:10px 24px 20px;">
        <h3 style="margin:0 0 8px;color:#93c5fd;font-size:16px;">Recent Keyword Performance</h3>
        <table style="width:100%;border-collapse:collapse;background:var(--bg);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
          <thead>
            <tr>
              <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--border);color:var(--muted);font-weight:600;font-size:13px;">Keyword</th>
              <th style="text-align:center;padding:10px 12px;border-bottom:1px solid var(--border);color:var(--muted);font-weight:600;font-size:13px;">Difficulty</th>
              <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--border);color:var(--muted);font-weight:600;font-size:13px;">Avg Views</th>
              <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--border);color:var(--muted);font-weight:600;font-size:13px;">Avg Subs</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
      </div>

      <div style="padding:0 24px 20px;color:var(--muted);font-size:13px;line-height:1.5;">
        💡 <strong>Pro Tip:</strong> Difficulty ≤ 60 + high views = publish now 🔥
      </div>

      <div style="background:#1e293b;padding:16px 24px;text-align:center;color:#94a3b8;font-size:12px;">
        <p style="margin:0 0 4px;">Want deeper insights? <a href="https://algomade.com/pricing" style="color:#60a5fa;text-decoration:none;">Upgrade to Pro</a></p>
        <p style="margin:0;">© ${new Date().getFullYear()} AlgoMade. All rights reserved.</p>
      </div>

    </div>
  </body>
</html>`;
}

/* -------------------------------------------------------------------------- */
/* 📧 Send Email                                                              */
/* -------------------------------------------------------------------------- */
async function sendEmail(to: string, subject: string, html: string) {
  const plainText = html
    .replace(/<[^>]+>/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 4000);

  if (!RESEND_API_KEY) {
    console.log(`[digest] RESEND_API_KEY not set — skipping email (dry-run for ${to})`);
    return { status: "dry-run" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html, text: plainText }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("[digest] Resend error:", t);
    throw new Error(`Resend ${res.status}: ${t}`);
  }
  return await res.json();
}

/* -------------------------------------------------------------------------- */
/* 🚀 Main Logic + Logging to cron_job_logs                                   */
/* -------------------------------------------------------------------------- */
Deno.serve(async () => {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: users, error: uErr } = await sb
      .from("profiles")
      .select("id, email, full_name, plan")
      .not("email", "is", null);

    if (uErr) throw uErr;

    let sentCount = 0;

    for (const user of users || []) {
      if (!user.email) continue;

      const { data: rows, error: rErr } = await sb
        .from("keyword_rank_insights")
        .select(
          "keyword, difficulty_score, avg_subs, avg_views, recommended_action, created_at"
        )
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      if (rErr) {
        console.error(`[digest] fetch rows error for ${user.email}:`, rErr.message);
        continue;
      }
      if (!rows?.length) continue;

      const html = renderEmailHTML(user, rows, start, end);
      const subject = `Your AlgoMade Weekly Digest • ${rows.length} insights`;

      await sendEmail(user.email, subject, html);

      await sb.from("weekly_digests").insert({
        user_id: user.id,
        sent_at: new Date().toISOString(),
        count: rows.length,
        period_start: start.toISOString(),
        period_end: end.toISOString(),
      });

      sentCount++;
    }

    // ✅ Log success to cron_job_logs
    await sb.from("cron_job_logs").insert({
      jobname: "weekly_digest_job",
      status: "success",
      message: `Weekly digest executed successfully for ${sentCount} users`,
    });

    return new Response(
      JSON.stringify({ message: "Weekly digest created", count: sentCount }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[digest] fatal:", e?.message || e);

    // 🚨 Log failure to cron_job_logs
    await sb.from("cron_job_logs").insert({
      jobname: "weekly_digest_job",
      status: "failed",
      message: e?.message || "Unknown error during weekly digest",
    });

    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
