import KeywordManager from "@/components/dashboard/keywords-v2/KeywordManager";
import { Keyword, TrendInfo } from "@/components/dashboard/keywords-v2/types";
import { headers, cookies } from "next/headers";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

async function fetchKeywords(projectId: string): Promise<Keyword[]> {
  const headersList = await headers();
  const cookieStore = await cookies();

  const host = headersList.get("host");
  const protocol =
    process.env.NODE_ENV === "production" ? "https://" : "http://";

  const res = await fetch(
    `${protocol}${host}/api/get-saved-keywords?project_id=${projectId}`,
    {
      cache: "no-store",
      headers: {
        Cookie: cookieStore.toString(),
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch keywords: ${text}`);
  }

  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : json;
}

async function fetchTrendData(
  projectId: string
): Promise<Record<string, TrendInfo>> {
  const headersList = await headers();
  const cookieStore = await cookies();

  const host = headersList.get("host");
  const protocol =
    process.env.NODE_ENV === "production" ? "https://" : "http://";

  const res = await fetch(
    `${protocol}${host}/api/keywords/trends?project_id=${projectId}`,
    {
      cache: "no-store",
      headers: {
        Cookie: cookieStore.toString(),
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch trend data: ${text}`);
  }

  const json = await res.json();
  return json.trends ?? {};
}

export default async function KeywordsV2Page({ params }: PageProps) {
  const { projectId } = await params;

  const [keywords, trendData] = await Promise.all([
    fetchKeywords(projectId),
    fetchTrendData(projectId),
  ]);

  return <KeywordManager keywords={keywords} trendData={trendData} />;
}
