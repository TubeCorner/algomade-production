// src/app/api/projects/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";

/* -------------------------------------------------------------------------- */
/* 🟢 GET — Fetch all projects for the current user                            */
/* -------------------------------------------------------------------------- */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    console.log("SESSION:", session);

    const userId = session?.user?.id;

    if (!userId) {
      console.log("❌ No userId in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching projects for user:", userId);

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*") // 🔥 simplified for debugging
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log("Projects found:", data?.length);

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err: any) {
    console.error("❌ GET /projects fatal error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load projects" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* 🟡 POST — Create a new project                                              */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description = "" } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        name: name.trim(),
        description: description.trim(),
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /projects fatal error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
