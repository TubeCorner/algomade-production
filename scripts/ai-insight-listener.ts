import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

console.log("🚀 AI Insight Listener starting...");
console.log("🔌 Connecting to Supabase Realtime...");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ✅ A small in-memory queue
const taskQueue: any[] = [];
let processing = false;

// Utility: Sleep
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 🧠 Add new job to queue
function enqueueJob(data: any) {
  taskQueue.push(data);
  processQueue();
}

// 🚀 Sequential processor
async function processQueue() {
  if (processing) return;
  processing = true;

  while (taskQueue.length > 0) {
    const data = taskQueue.shift();

    try {
      console.log(`🧩 Processing keyword: "${data.keyword}"`);

      const prompt = `
You are a YouTube SEO strategist.
Based on the following metrics, give a concise actionable insight.

Keyword: ${data.keyword}
Total Videos: ${data.video_count}
Average Views: ${data.avg_views}
Freshness (30d): ${data.freshness}%
Difficulty: ${data.difficulty}/100
Opportunity: ${data.opportunity}/100
Rank Potential: ${data.rank_potential}/100

Give a short summary (2–3 sentences) advising the creator.
`;

      // Retry logic (up to 3 attempts)
      let insight = "";
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const ai = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
          });

          insight = ai.choices[0].message?.content?.trim() || "";
          if (insight) break;
        } catch (e: any) {
          console.warn(`⚠️ OpenAI retry ${attempt}/3 failed:`, e.message);
          await sleep(2000 * attempt);
        }
      }

      if (!insight) {
        console.warn(`⚠️ No insight generated for "${data.keyword}".`);
        continue;
      }

      const { error } = await supabase
        .from("keywords")
        .update({ insight })
        .eq("id", data.id);

      if (error) {
        console.error(
          `❌ Failed to update insight for "${data.keyword}":`,
          error.message
        );
      } else {
        console.log(`✅ Insight updated for "${data.keyword}"`);
      }
    } catch (err: any) {
      console.error("⚠️ Queue processing error:", err.message);
    }

    // Small delay to prevent API overload
    await sleep(1000);
  }

  processing = false;
}

async function main() {
  console.log("⚙️ Subscribing to table changes...");

  supabase
    .channel("public:keywords")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "keywords",
      },
      async (payload) => {
        const data = payload.new as {
          id?: string;
          keyword?: string;
          insight?: string | null;
        };

        if (!data.keyword) return;

        // Skip if already has AI insight (prevent infinite loop)
        if (data.insight && payload.eventType === "UPDATE") {
          console.log(
            `⏩ Skipping update for "${data.keyword}" (already has insight).`
          );
          return;
        }

        console.log(`📦 Queued keyword: "${data.keyword}"`);
        enqueueJob(data);
      }
    )
    .subscribe((status) => {
      console.log(`🔔 Channel status: ${status}`);
      if (status === "SUBSCRIBED") {
        console.log("📡 Listening for keyword updates...");
      }
    });
}

main();
