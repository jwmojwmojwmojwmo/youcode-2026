"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markVolunteerNotificationsAsRead() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return;
  }

  await supabase
    .from("volunteer_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("volunteer_id", user.id)
    .is("read_at", null);

  revalidatePath("/");
  revalidatePath("/volunteer/applications");
  revalidatePath("/volunteer/profile");
  revalidatePath("/volunteer/certificate");
  revalidatePath("/volunteer/progression");
}

export async function clearVolunteerNotifications() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return;
  }

  await supabase
    .from("volunteer_notifications")
    .delete()
    .eq("volunteer_id", user.id);

  revalidatePath("/");
  revalidatePath("/volunteer/applications");
  revalidatePath("/volunteer/profile");
  revalidatePath("/volunteer/certificate");
  revalidatePath("/volunteer/progression");
}
