export type TrendDirection = "rising" | "falling" | "stable";
export type Opportunity = "explosive" | "high" | "medium" | "low";
export type Source = "ai" | "youtube" | "manual";

export interface Keyword {
  id: string;
  keyword: string;
  source: Source;
  created_at: string;
}

export interface TrendInfo {
  direction: TrendDirection;
  potential: Opportunity;
}

