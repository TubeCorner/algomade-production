/**
 * scripts/worker/ingest-and-aggregate.ts
 *
 * Node/TypeScript runnable worker for AlgoMade Trend Spike Detector
 *
 * Responsibilities:
 *  - Pull signals from adapters (YouTube, GoogleTrends, Reddit, internal events)
 *  - Insert raw signals into `trend_signals`
 *  - Aggregate timeseries (per-topic) into hourly buckets for last 24/72 hours
 *  - Compute velocity, volatility, composite trend_score via computeTrendScore()
 *  - Upsert aggregate snapshot into `trend_aggregates`
 *
 * Usage:
 *   - Install: npm i @supabase/supabase-js node-fetch date-fns
 *   - Run manually: ts-node scripts/worker/ingest-and-aggregate.ts
 *   - Deploy: as Cloud Run job or Vercel cron that runs every 5 minutes
 *
 * IMPORTANT:
 *  Replace the placeholder adapter functions with real API calls.
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { formatISO, subHours, startOfHour } from 'date-fns';
//import { computeTrendScore } from '../../src/lib/trend/velocity'; // adjust path if necessary

// --- Environment variables (set these in your deployment platform) ---
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!; // needs service role to write tables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env var');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// TUNABLE PARAMETERS
const AGG_WINDOW_HOURS = 24; // primary snapshot window
const SAMPLE_INTERVAL_MIN = 10; // sample timeseries points per 10 minutes

// ---------- Placeholder adapters (replace with real implementations) ----------
/**
 * Example adapter signature:
 * async function fetchYouTubeSignals(sinceISO: string): Promise<Array<{ topic: string, value: number, timestamp: string, source: string, meta?: any }>>
 */
async function fetchYouTubeSignals(sinceISO: string) {
  // TODO: use YouTube Data API to fetch search/traffic/related query volumes, video view deltas etc.
  // For now, return mocked signals for demo
  return [
    { topic: 'ai thumbnail generators', value: Math.floor(Math.random() * 2000), timestamp: new Date().toISOString(), source: 'youtube', meta: { metric: 'views_delta' } },
    { topic: 'chatgpt thumbnail prompts', value: Math.floor(Math.random() * 600), timestamp: new Date().toISOString(), source: 'youtube', meta: { metric: 'search_volume' } },
  ];
}

async function fetchGoogleTrendsSignals(sinceISO: string) {
  // TODO: call a Google Trends wrapper to get topic interest over time (or use pytrends externally and push results)
  return [
    { topic: 'ai thumbnail generators', value: Math.floor(Math.random() * 100), timestamp: new Date().toISOString(), source: 'google_trends', meta: {} },
  ];
}

async function fetchRedditSignals(sinceISO: string) {
  // TODO: query Reddit API for mentions in /r/videos, /r/youtubers, etc.
  return [];
}

// ---------- Helpers ----------
type Signal = { topic: string; value: number; timestamp: string; source: string; meta?: any };

function groupByTopic(signals: Signal[]) {
  const map = new Map<string, Signal[]>();
  for (const s of signals) {
    if (!map.has(s.topic)) map.set(s.topic, []);
    map.get(s.topic)!.push(s);
  }
  return map;
}

/**
 * Build regular sampled series for the last `hours` hours with a sample every `intervalMin` minutes.
 * We'll aggregate signals that fall into the same sample bucket by sum.
 */
function buildSampledSeries(signals: Signal[], hours = AGG_WINDOW_HOURS, intervalMin = SAMPLE_INTERVAL_MIN) {
  const now = new Date();
  const start = subHours(now, hours);
  const buckets: Record<string, { t: string; v: number }> = {};

  // generate bucket keys
  let cursor = startOfHour(start);
  while (cursor <= now) {
    const key = formatISO(cursor);
    buckets[key] = { t: key, v: 0 };
    cursor = new Date(cursor.getTime() + intervalMin * 60 * 1000);
  }

  // aggregate signals into nearest bucket timestamp (floor to interval)
  for (const s of signals) {
    const ts = new Date(s.timestamp).getTime();
    if (isNaN(ts)) continue;
    if (ts < start.getTime()) continue;
    const elapsedMs = ts - start.getTime();
    const bucketIndex = Math.floor(elapsedMs / (intervalMin * 60 * 1000));
    const bucketTime = new Date(start.getTime() + bucketIndex * intervalMin * 60 * 1000);
    const key = formatISO(bucketTime);
    if (!buckets[key]) buckets[key] = { t: key, v: 0 };
    buckets[key].v += s.value;
  }

  // produce ordered array
  const arr = Object.values(buckets).sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  return arr;
}

// ---------- Main worker flow ----------
async function runOnce() {
  console.log('Worker start:', new Date().toISOString());

  // 1) Fetch signals from adapters for the last AGG_WINDOW_HOURS
  const sinceISO = formatISO(subHours(new Date(), AGG_WINDOW_HOURS));
  const [yt, gt, rd] = await Promise.all([
    fetchYouTubeSignals(sinceISO),
    fetchGoogleTrendsSignals(sinceISO),
    fetchRedditSignals(sinceISO),
  ]);

  const signals: Signal[] = [...yt, ...gt, ...rd];

  if (signals.length === 0) {
    console.log('No signals fetched.');
    return;
  }

  // 2) Insert raw signals to supabase (batch insert)
  try {
    const insertRows = signals.map((s) => ({
      topic: s.topic,
      timestamp: s.timestamp,
      signal_type: s.source,
      value: s.value,
      source: s.source,
      meta: s.meta || {},
    }));
    const { error: insertErr } = await supabase.from('trend_signals').insert(insertRows);
    if (insertErr) console.warn('Insert raw signals error:', insertErr.message);
    else console.log(`Inserted ${insertRows.length} raw signals`);
  } catch (e: any) {
    console.error('Error inserting raw signals:', e.message || e);
  }

  // 3) Group by topic and compute aggregates + upsert
  const topicMap = groupByTopic(signals);
  for (const [topic, topicSignals] of topicMap.entries()) {
    // Build sampled series
    const series = buildSampledSeries(topicSignals, AGG_WINDOW_HOURS, SAMPLE_INTERVAL_MIN);

    // Compute score via computeTrendScore
    // computeTrendScore expects TimeseriesPoint[] with {t, v}
    // const { score, velocity, volatility } = computeTrendScore(
      series.map((p) => ({ t: p.t, v: p.v }))
    );

    const sumValue = series.reduce((a, b) => a + b.v, 0);
    const avgValue = series.length ? sumValue / series.length : 0;

    // snapshot store raw series + meta
    const windowEnd = new Date().toISOString();
    const windowStart = formatISO(subHours(new Date(), AGG_WINDOW_HOURS));

    const snapshot = { timeseries: series, computed_at: new Date().toISOString(), sample_interval_min: SAMPLE_INTERVAL_MIN };

    // UPSERT into trend_aggregates, unique on (topic, window_start, window_end)
    // Using supabase upsert with constraint - ensure unique constraint exists in DB (schema.sql includes UNIQUE(topic, window_start, window_end))
    try {
      const upsertRow = {
        topic,
        window_start: windowStart,
        window_end: windowEnd,
        sum_value: sumValue,
        avg_value: avgValue,
        velocity,
        volatility,
        trend_score: score,
        snapshot,
      };
      const { error: upsertErr } = await supabase.from('trend_aggregates').upsert(upsertRow, { onConflict: '(topic, window_start, window_end)' });
      if (upsertErr) console.warn('Upsert aggregate error for', topic, upsertErr.message);
      else console.log(`Upserted aggregated snapshot for topic="${topic}" score=${score}`);
    } catch (e: any) {
      console.error('Upsert error:', e.message || e);
    }
  }

  console.log('Worker finished:', new Date().toISOString());
}

// Run if executed (single run)
if (require.main === module) {
  runOnce()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Worker failed:', e);
      process.exit(1);
    });
}

// Export for programmatic use (if you want to import in a scheduled runner)
export { runOnce };
