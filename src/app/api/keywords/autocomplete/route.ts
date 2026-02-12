import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // YouTube Autocomplete Endpoint (Unofficial)
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(url);
    const data = await response.json();

    // data[1] typically contains the keyword suggestions
    const suggestions = data[1] || [];

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("❌ Autocomplete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

