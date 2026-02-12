/* -------------------------------------------------------------------------- */
/* 🎯 getKeywordRecommendation (Stabilized Version)                           */
/* -------------------------------------------------------------------------- */

/* 🚀 Launch override */
const EMAIL_GATE_LAUNCH_MODE = true;

export function getKeywordRecommendation({
  velocity,
  opportunity,
  difficulty,
  isProUser = false,
}: {
  velocity: number;
  opportunity: number;
  difficulty: number;
  isProUser?: boolean;
}) {
  /* ✔ Normalize unsafe values */
  const v = Number.isFinite(velocity) ? velocity : 0;
  const o = Number.isFinite(opportunity) ? opportunity : 0;
  const d = Number.isFinite(difficulty) ? difficulty : 50;

  /* 🔓 Effective access (launch-safe) */
  const hasProAccess = isProUser || EMAIL_GATE_LAUNCH_MODE;

  /* ---------------------------------------------------------------------- */
  /* 🧩 FREE USER TEASERS                                                    */
  /* ---------------------------------------------------------------------- */
  if (!hasProAccess) {
    if (v > 50)
      return "🔥 Hot topic! Unlock full posting strategy with AlgoMade Pro 🚀";
    if (v > 20)
      return "⚡ Rising keyword — deeper insights available in Pro.";
    if (v > 0)
      return "🌱 Gradual growth — audience windows unlocked in Pro.";
    return "🧩 Quiet trend — Pro users see competition analysis.";
  }

  /* ---------------------------------------------------------------------- */
  /* 💎 PRO USER INSIGHTS                                                    */
  /* ---------------------------------------------------------------------- */
  if (v > 60 && o > 70 && d < 40)
    return "🔥 Exploding opportunity! Post now — low competition & high demand.";

  if (v > 30 && o > 50 && d < 60)
    return "⚡ Strong window — ideal for quick-turn videos or tutorials.";

  if (v > 10 && d > 70)
    return "🧩 Competitive niche — use specific titles and trending subtopics.";

  if (v < 0 && d > 60)
    return "📉 Trend cooling — consider pausing and exploring adjacent keywords.";

  return "🌿 Evergreen topic — excellent for consistent long-term growth.";
}

