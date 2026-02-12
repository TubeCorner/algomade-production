// src/lib/computeOpportunityScore.ts
export function computeOpportunityScore(row: {
  velocity?: number;
  yt_avg_views?: number;
  yt_new_uploads?: number;
}): number {
  const velocity = Number(row.velocity ?? 0);
  const views = Number(row.yt_avg_views ?? 0);
  const uploads = Number(row.yt_new_uploads ?? 0);

  // 1️⃣ Normalize velocity (momentum)
  const normVelocity = (Math.max(-100, Math.min(100, velocity)) + 100) / 200;

  // 2️⃣ Demand indicator (log-scaling)
  const demand = Math.min(1, Math.log10(views + 10) / 6);

  // 3️⃣ Competition score (lower uploads = better)
  const competition = Math.max(0, 1 - uploads / 15);

  // 4️⃣ Combined score
  const raw =
    0.5 * normVelocity +
    0.3 * demand +
    0.2 * competition;

  // 5️⃣ Smooth curve
  return Math.round(Math.pow(raw, 0.85) * 100);
}

