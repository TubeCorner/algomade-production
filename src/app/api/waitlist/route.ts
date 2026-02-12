import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { sendWaitlistEmail } from "@/lib/email/sendWaitlistEmail";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json(
      { error: "Email required" },
      { status: 400 }
    );
  }

  const { error } = await supabaseService
    .from("waitlist_emails")
    .upsert(
      { email },
      { onConflict: "email" }
    );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  await sendWaitlistEmail(email);

  return NextResponse.json({ success: true });
}

