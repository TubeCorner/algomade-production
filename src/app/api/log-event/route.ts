import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventName, metadata } = await req.json();

  await supabaseAdmin.from("user_events").insert({
    user_id: session.user.id,
    event_name: eventName,
    metadata: metadata || {},
  });

  return NextResponse.json({ success: true });
}
