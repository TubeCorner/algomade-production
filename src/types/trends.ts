export interface TrendRow {
  keyword: string;
  direction: "rising" | "falling" | "stable" | "error";
  velocity: number;
  trend_7d: number;
  trend_30d: number;
  yt_avg_views: number;
  yt_new_uploads: number;
  opportunity_score: number;
  updated_at?: string | null;
}
