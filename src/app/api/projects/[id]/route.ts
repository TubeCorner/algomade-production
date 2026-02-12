// src/app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

/* -------------------------------------------------------------------------- */
/* 🟡 PUT — Update project                                                     */
/* -------------------------------------------------------------------------- */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await cookies();

    const { id } = await params; // ✅ Next.js 15 fix

    const session = (await getServerSession(authOptions)) ;
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name?.trim() && !description?.trim()) {
      return NextResponse.json(
        { error: "At least one field must be provided" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (name?.trim()) updates.name = name.trim();
    if (description?.trim()) updates.description = description.trim();

    const { error } = await supabaseAdmin
      .from("projects")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId); // still enforce ownership

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      updates,
    });
  } catch (err: any) {
    console.error("❌ PUT /projects/[id] error:", err.message || err);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* 🔴 DELETE — Delete project                                                 */
/* -------------------------------------------------------------------------- */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await cookies();

    const { id } = await params; // ✅ Next.js 15 fix

    const session = (await getServerSession(authOptions)) ;
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (err: any) {
    console.error("❌ DELETE /projects/[id] error:", err.message || err);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

