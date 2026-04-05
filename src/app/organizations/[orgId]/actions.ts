"use server";

import { APPLICATION_STATUSES } from "@/lib/application-status";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function clampRating(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
}

export async function submitOrganizationReview(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect("/login");
  }

  const orgId = String(formData.get("orgId") ?? "").trim();
  const rawRating = Number(String(formData.get("rating") ?? "0"));
  const reviewText = String(formData.get("reviewText") ?? "").trim() || null;
  const rating = clampRating(rawRating);

  if (!orgId || rating < 1) {
    return;
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .maybeSingle();

  if (!organization) {
    return;
  }

  const { data: eligibleHistory } = await supabase
    .from("event_applications")
    .select("id, events!inner(org_id)")
    .eq("volunteer_id", user.id)
    .eq("status", APPLICATION_STATUSES.ACCEPTED)
    .eq("attended", true)
    .eq("events.org_id", orgId)
    .limit(1)
    .maybeSingle();

  if (!eligibleHistory?.id) {
    redirect(`/organizations/${orgId}?reviewError=volunteering-required`);
  }

  const { data: volunteer } = await supabase
    .from("volunteers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!volunteer) {
    await supabase.from("volunteers").upsert(
      {
        id: user.id,
        name: user.user_metadata?.full_name || user.email || "Volunteer",
        contact_email: user.email || null,
        completed_hours: 0,
        completed_events: 0,
        rating: 0,
        skills: []
      },
      { onConflict: "id" }
    );
  }

  const { data: existingReview } = await supabase
    .from("organization_reviews")
    .select("id")
    .eq("org_id", orgId)
    .eq("volunteer_id", user.id)
    .maybeSingle();

  if (existingReview?.id) {
    await supabase
      .from("organization_reviews")
      .update({ rating, review_text: reviewText })
      .eq("id", existingReview.id);
  } else {
    await supabase.from("organization_reviews").insert({
      org_id: orgId,
      volunteer_id: user.id,
      rating,
      review_text: reviewText
    });
  }

  revalidatePath(`/organizations/${orgId}`);
}
