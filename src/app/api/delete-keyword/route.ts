import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";import { authOptions } from "@/lib/authOptions";
import { createServerSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function DELETE(req: Request) {
  try {
    // Required in Next.js 15+
    await cookies();

    const session = (await getServerSession(authOptions)) ;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = await createServerSupabase();

    const url = new URL(req.url);

    // Support both possible param names
    const idParam = url.searchParams.get("id");
    const projectIdQP =
      url.searchParams.get("projectId") ||
      url.searchParams.get("project_id");

    /* ------------------------------------------------------
       🧹 SINGLE DELETE — via query params
       /api/delete-keyword?id=123&projectId=xyz
    ------------------------------------------------------ */
    if (idParam && projectIdQP) {
      console.log("🔹 Single delete:", { idParam, projectIdQP });

      const { error } = await supabase
        .from("keyword_projects")
        .delete()
        .eq("id", idParam)
        .eq("user_id", userId)
        .eq("project_id", projectIdQP)
        .limit(1); // Safety

      if (error) throw error;

      return NextResponse.json({
        success: true,
        deletedId: idParam,
      });
    }

    /* ------------------------------------------------------
       🧹 BULK DELETE — via JSON body
       { "ids": [...], "projectId": "..." }
    ------------------------------------------------------ */
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const ids = Array.isArray(body.ids) ? body.ids : [];
    const projectIdBody =
      body.projectId || body.project_id || null;

    if (!ids.length || !projectIdBody) {
      return NextResponse.json(
        { error: "Missing ids[] or projectId" },
        { status: 400 }
      );
    }

    console.log("🔹 Bulk delete:", { ids, projectIdBody });

    const { error } = await supabase
      .from("keyword_projects")
      .delete()
      .in("id", ids)
      .eq("user_id", userId)
      .eq("project_id", projectIdBody);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deletedCount: ids.length,
    });
  } catch (err: any) {
    console.error("❌ Delete keyword error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete keyword" },
      { status: 500 }
    );
  }
}


