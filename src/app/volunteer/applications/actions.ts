"use server";

import { APPLICATION_STATUSES } from "@/lib/application-status";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function submitVolunteerEventNote(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect("/login");
  }

  const orgId = String(formData.get("orgId") ?? "").trim();
  const eventName = String(formData.get("eventName") ?? "").trim();
  const noteText = String(formData.get("noteText") ?? "").trim();

  if (!orgId || !eventName || noteText.length < 8) {
    redirect("/volunteer/applications?tab=past&noteStatus=invalid");
  }

  const { data: eligibleApplication } = await supabase
    .from("event_applications")
    .select("id, events!inner(org_id, title, status)")
    .eq("volunteer_id", user.id)
    .eq("status", APPLICATION_STATUSES.ACCEPTED)
    .eq("attended", true)
    .eq("events.org_id", orgId)
    .eq("events.title", eventName)
    .eq("events.status", "completed")
    .limit(1)
    .maybeSingle();

  if (!eligibleApplication?.id) {
    redirect("/volunteer/applications?tab=past&noteStatus=not-eligible");
  }

  const { data: existingNote } = await supabase
    .from("event_notes")
    .select("id")
    .eq("org_id", orgId)
    .eq("volunteer_id", user.id)
    .eq("event_name", eventName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingNote?.id) {
    await supabase
      .from("event_notes")
      .update({ note_text: noteText })
      .eq("id", existingNote.id);

    revalidatePath("/volunteer/applications");
    revalidatePath("/org/events");
    redirect("/volunteer/applications?tab=past&noteStatus=updated");
  } else {
    await supabase
      .from("event_notes")
      .insert({
        org_id: orgId,
        volunteer_id: user.id,
        event_name: eventName,
        note_text: noteText
      });

    revalidatePath("/volunteer/applications");
    revalidatePath("/org/events");
    redirect("/volunteer/applications?tab=past&noteStatus=saved");
  }
}
