// src/app/api/keywords/search/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Load YouTube API key
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Mock YouTube data function
 * Replace with your real YouTube search API call later.
 */
async function getYouTubeData(keyword: string) {
  if (!YOUTUBE_API_KEY) {
    console.error("YOUTUBE_API_KEY is missing.");
    return { error: "API key not configured" };
  }

  // Simple mock logic
  const mockResults = [
    { keyword: "next js tutorial 2024", searchVolume: 15000, competition: "Low" },
    { keyword: "how to build saas nextjs", searchVolume: 4000, competition: "Medium" },
    { keyword: "next auth guide", searchVolume: 8000, competition: "Low" },
  ];

  const firstWord = keyword.toLowerCase().split(" ")[0];
  return mockResults.filter((r) => r.keyword.includes(firstWord));
}

export async function GET(request: Request) {
  // 🔐 Validate session
  const session = (await getServerSession(authOptions)) ;
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json({ message: "Missing 'keyword' parameter" }, { status: 400 });
  }

  try {
    const results = await getYouTubeData(keyword);

    return NextResponse.json({
      success: true,
      keyword,
      data: results,
    });
  } catch (err: any) {
    console.error("Keyword API Error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


