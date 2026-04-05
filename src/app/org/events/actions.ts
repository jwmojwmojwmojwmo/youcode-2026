"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireOrganizationUser() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect("/org/login");
  }

  return { supabase, user };
}

export async function markOrganizationNotificationsAsRead() {
  const { supabase, user } = await requireOrganizationUser();

  await supabase
    .from("organization_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("org_id", user.id)
    .is("read_at", null);

  revalidatePath("/org");
  revalidatePath("/org/events");
}
