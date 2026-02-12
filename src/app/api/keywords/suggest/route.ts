// src/app/api/generate-tags/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { google } from 'googleapis'; // 👈 New Import for YouTube API
import OpenAI from 'openai'; // 👈 New Import for OpenAI

// ⚠️ IMPORTANT: Initialize the YouTube API Client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY, // Use the API Key from your .env.local file
});

// ⚠️ IMPORTANT: Initialize the OpenAI Client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Assumes you added this key in an earlier step
});


// ----------------------------------------------------
// Core Function 1: Get the Top Video Title from YouTube
// ----------------------------------------------------
async function getTopVideoTitle(keyword: string): Promise<string | null> {
    try {
        const response = await youtube.search.list({
            q: keyword,
            part: ['snippet'],
            type: ['video'],
            maxResults: 1, // We only need the top result
        });

        const topVideo = response.data.items?.[0];
        if (topVideo && topVideo.snippet) {
            console.log('Found Top Video:', topVideo.snippet.title);
            return topVideo.snippet.title ?? null;
        }
        return null;

    } catch (error) {
        console.error('YouTube API Error:', error);
        return null;
    }
}

// ----------------------------------------------------
// Core Function 2: Generate Tags using the AI Model
// ----------------------------------------------------
async function generateAITags(videoTitle: string): Promise<string[]> {
    const prompt = `Based on this top-ranking video title, generate 10 highly relevant, comma-separated YouTube SEO tags: "${videoTitle}"`;
    
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Use a cost-effective model for tag generation
            messages: [{ role: "user", content: prompt }],
        });

        const rawTags = completion.choices[0].message.content;
        
        if (rawTags) {
            // Clean up the response and split into an array of tags
            return rawTags
                .toLowerCase()
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
        }
        return [];
        
    } catch (error) {
        console.error('OpenAI API Error:', error);
        // Fallback or empty array on failure
        return [`error-tags-${Math.floor(Math.random() * 100)}`]; 
    }
}


export async function POST(request: Request) {
  const session = (await getServerSession(authOptions)) ;
  
  // 🔐 Security check
  if (!session) {
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { videoTitle } = await request.json();

  if (!videoTitle) {
    return new NextResponse(JSON.stringify({ message: "Missing 'videoTitle' parameter" }), { status: 400 });
  }

  try {
    // 1. Get contextual video title from YouTube
    const topVideoTitle = await getTopVideoTitle(videoTitle);
    
    if (!topVideoTitle) {
        return new NextResponse(JSON.stringify({ message: "Could not find a top video result for the keyword." }), { status: 404 });
    }
    
    // 2. Generate tags using the AI model with the video title as context
    const tags = await generateAITags(topVideoTitle);
    
    // 3. Return the generated tags
    return NextResponse.json({
        success: true,
        videoTitle: topVideoTitle, // Return the title used for generation
        tags: tags
    });

  } catch (error) {
    console.error('Final API Route Error:', error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}





