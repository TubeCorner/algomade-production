import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return Response.json({ error: "ID required" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { error } = await supabase.rpc("increment_view_trending", {
      k_id: id,
    });

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

