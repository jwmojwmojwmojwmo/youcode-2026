import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ unreadCount: 0 }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const { count, error } = await supabase
    .from("organization_notifications")
    .select("id", { count: "exact", head: true })
    .eq("org_id", user.id)
    .is("read_at", null);

  if (error) {
    return NextResponse.json({ unreadCount: 0 }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { unreadCount: count ?? 0 },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
