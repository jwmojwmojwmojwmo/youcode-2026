import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VolunteerHeaderMenus from "@/app/volunteer/_components/VolunteerHeaderMenus";
import ReloadButton from "@/components/ReloadButton";
import { APPLICATION_STATUSES } from "@/lib/application-status";
import {
  buildEventMetaById,
  normalizeVolunteerApplications,
  type VolunteerApplicationEventMetaInput
} from "@/lib/volunteer-application-utils";
import { cn } from "@/lib/utils";
import {
  getVolunteerApplicationEarnedHoursLabel,
  getVolunteerApplicationEventTitle,
  splitVolunteerApplicationsByEventStatus
} from "@/lib/volunteer-application-utils";
import type { VolunteerApplication } from "@/types/volunteer";
import { clearVolunteerNotifications, markVolunteerNotificationsAsRead, submitVolunteerEventNote } from "./actions";
import VolunteerApplicationsTabs from "./volunteer-applications-tabs";

type VolunteerApplicationsPageProps = {
  searchParams?: Promise<{
    tab?: string;
    noteStatus?: string;
  }>;
};

type ApplicationViewItem = {
  id: string;
  title: string;
  status: string;
  appliedAt: string | null;
  hoursLabel: string;
  organizationId: string | null;
  organizationName: string | null;
};

type VolunteerNotificationItem = {
  id: string;
  kind: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

type VolunteerEventNote = {
  id: string;
  org_id: string;
  event_name: string;
  note_text: string;
  created_at: string;
};

type EventNoteDraftItem = {
  applicationId: string;
  orgId: string;
  organizationName: string | null;
  eventName: string;
  existingNote: string;
};

type EmbeddedOrganization = {
  id: string;
  name: string;
};

type ApplicationOrganizationQueryRow = {
  id: string;
  event_id: string;
  status: string;
  attended?: boolean;
  applied_at?: string;
  events:
    | {
        title?: string;
        status?: string;
        hours_given?: number;
        org_id?: string | null;
        organizations?: EmbeddedOrganization | EmbeddedOrganization[] | null;
      }
    | {
        title?: string;
        status?: string;
        hours_given?: number;
        org_id?: string | null;
        organizations?: EmbeddedOrganization | EmbeddedOrganization[] | null;
      }[]
    | null;
};

function getApplicationOrganizationInfo(application: ApplicationOrganizationQueryRow) {
  const eventRelation = Array.isArray(application.events)
    ? application.events[0]
    : application.events;

  if (!eventRelation) {
    return { organizationId: null, organizationName: null };
  }

  const organizationRelation = eventRelation.organizations;
  const organization = Array.isArray(organizationRelation)
    ? organizationRelation[0]
    : organizationRelation;

  return {
    organizationId: organization?.id ?? eventRelation.org_id ?? null,
    organizationName: organization?.name ?? null
  };
}

function getNotificationTypeLabel(kind: string) {
  switch (kind) {
    case "application_accepted":
      return "Application accepted";
    case "application_rejected":
      return "Application update";
    case "event_completed":
      return "Event completed";
    default:
      return "Update";
  }
}

function buildEventNoteKey(orgId: string, eventName: string) {
  return `${orgId}::${eventName.trim().toLowerCase()}`;
}

function getEventNoteStatusMessage(noteStatus: string | undefined) {
  switch (noteStatus) {
    case "saved":
      return { tone: "success", text: "Your note was saved and is now visible to the organization." };
    case "updated":
      return { tone: "success", text: "Your note was updated successfully." };
    case "invalid":
      return { tone: "error", text: "Please enter a note with at least 8 characters before submitting." };
    case "not-eligible":
      return { tone: "error", text: "You can only submit notes for completed events where you were accepted and marked attended." };
    default:
      return null;
  }
}

export default async function VolunteerApplicationsPage({ searchParams }: VolunteerApplicationsPageProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect("/login");
  }

  const { data: applicationsData } = await supabase
    .from("event_applications")
    .select("id, event_id, status, attended, applied_at, events(title, status, hours_given, org_id, organizations(id, name))")
    .eq("volunteer_id", user.id)
    .order("applied_at", { ascending: false });

  const applicationsWithOrgData = (applicationsData ?? []) as ApplicationOrganizationQueryRow[];
  const organizationByApplicationId = new Map(
    applicationsWithOrgData.map((application) => [application.id, getApplicationOrganizationInfo(application)])
  );

  const { data: eventsData } = await supabase
    .from("events")
    .select("id, title, status, hours_given")
    .in("id", (applicationsData ?? []).map((application) => application.event_id));

  const { data: notificationsData, error: notificationsError } = await supabase
    .from("volunteer_notifications")
    .select("id, kind, title, message, created_at, read_at")
    .eq("volunteer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  const { data: eventNotesData } = await supabase
    .from("event_notes")
    .select("id, org_id, event_name, note_text, created_at")
    .eq("volunteer_id", user.id)
    .order("created_at", { ascending: false });

  const eventMetaRows = (eventsData ?? []) as VolunteerApplicationEventMetaInput[];
  const applications = normalizeVolunteerApplications(
    (applicationsData ?? []) as VolunteerApplication[],
    buildEventMetaById(eventMetaRows)
  );
  const { currentApplications, pastApplications } = splitVolunteerApplicationsByEventStatus(applications);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tabParam = (resolvedSearchParams?.tab || "").toLowerCase();
  const noteStatusMessage = getEventNoteStatusMessage(resolvedSearchParams?.noteStatus);
  const initialTab = tabParam === "accepted" || tabParam === "rejected" || tabParam === "past" ? tabParam : "applied";

  const currentViewItems: ApplicationViewItem[] = currentApplications.map((application) => ({
    id: application.id,
    title: getVolunteerApplicationEventTitle(application),
    status: application.status,
    appliedAt: application.applied_at ?? null,
    hoursLabel: getVolunteerApplicationEarnedHoursLabel(application),
    organizationId: organizationByApplicationId.get(application.id)?.organizationId ?? null,
    organizationName: organizationByApplicationId.get(application.id)?.organizationName ?? null
  }));

  const pastViewItems: ApplicationViewItem[] = pastApplications.map((application) => ({
    id: application.id,
    title: getVolunteerApplicationEventTitle(application),
    status: application.status,
    appliedAt: application.applied_at ?? null,
    hoursLabel: getVolunteerApplicationEarnedHoursLabel(application),
    organizationId: organizationByApplicationId.get(application.id)?.organizationId ?? null,
    organizationName: organizationByApplicationId.get(application.id)?.organizationName ?? null
  }));

  const appliedItems = currentViewItems.filter((application) =>
    application.status === APPLICATION_STATUSES.APPLIED
    || application.status === APPLICATION_STATUSES.WAITLISTED
    || application.status === APPLICATION_STATUSES.NEEDS_SKILL_VERIFICATION
  );
  const acceptedItems = currentViewItems.filter((application) => application.status === APPLICATION_STATUSES.ACCEPTED);
  const rejectedItems = currentViewItems.filter((application) =>
    application.status === APPLICATION_STATUSES.DECLINED
    || application.status === APPLICATION_STATUSES.WITHDRAWN
  );

  const notifications = notificationsError
    ? []
    : (notificationsData ?? []) as VolunteerNotificationItem[];
  const unreadNotificationsCount = notifications.filter((notification) => !notification.read_at).length;

  const notes = (eventNotesData ?? []) as VolunteerEventNote[];
  const noteByEventKey = new Map<string, VolunteerEventNote>();
  for (const note of notes) {
    const key = buildEventNoteKey(note.org_id, note.event_name);
    if (!noteByEventKey.has(key)) {
      noteByEventKey.set(key, note);
    }
  }

  const noteDraftByEventKey = new Map<string, EventNoteDraftItem>();
  for (const application of applicationsWithOrgData) {
    const eventRelation = Array.isArray(application.events) ? application.events[0] : application.events;
    const eventStatus = String(eventRelation?.status ?? "").toLowerCase();
    const isEligibleForEventNotes =
      application.status === APPLICATION_STATUSES.ACCEPTED
      && Boolean(application.attended)
      && eventStatus === "completed";

    if (!isEligibleForEventNotes) {
      continue;
    }

    const organizationInfo = getApplicationOrganizationInfo(application);
    const orgId = organizationInfo.organizationId;
    const eventName = (eventRelation?.title || "").trim();

    if (!orgId || !eventName) {
      continue;
    }

    const key = buildEventNoteKey(orgId, eventName);
    if (noteDraftByEventKey.has(key)) {
      continue;
    }

    noteDraftByEventKey.set(key, {
      applicationId: application.id,
      orgId,
      organizationName: organizationInfo.organizationName,
      eventName,
      existingNote: noteByEventKey.get(key)?.note_text ?? ""
    });
  }

  const eventNoteDrafts = Array.from(noteDraftByEventKey.values());

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="paper-panel rounded-[1.6rem] px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <VolunteerHeaderMenus isSignedIn={Boolean(user)} />
            <ReloadButton label="Refresh" />
          </div>
        </section>

        <section
          className="paper-panel rounded-[1.6rem] p-4 sm:p-5"
          aria-labelledby="application-updates-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="application-updates-heading" className="display-font text-2xl font-semibold text-slate-900">Application updates</h2>
              <p className="mt-1 text-sm text-slate-700">Review the latest changes to your applications and completed events.</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800" role="status" aria-live="polite">
                {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread` : "All caught up"}
              </p>
              <form action={markVolunteerNotificationsAsRead}>
                <button
                  type="submit"
                  disabled={unreadNotificationsCount === 0}
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-semibold",
                    unreadNotificationsCount === 0
                      ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500"
                      : "secondary-action"
                  )}
                >
                  Mark all as read
                </button>
              </form>
              <form action={clearVolunteerNotifications}>
                <button
                  type="submit"
                  disabled={notifications.length === 0}
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-semibold",
                    notifications.length === 0
                      ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500"
                      : "secondary-action"
                  )}
                  aria-label="Clear all application updates"
                >
                  Clear updates
                </button>
              </form>
            </div>
          </div>

          <ul className="mt-4 space-y-3" aria-label="Application notification list">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const isUnread = !notification.read_at;
                const typeLabel = getNotificationTypeLabel(notification.kind);
                const shouldShowTitle = notification.title.trim().toLowerCase() !== typeLabel.trim().toLowerCase();

                return (
                  <li key={notification.id}>
                    <article
                      className={cn(
                        "rounded-[1rem] border p-3 sm:p-4",
                        isUnread
                          ? "border-teal-700 bg-teal-50"
                          : "border-slate-200 bg-white"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {typeLabel}
                        </p>
                        <time className="text-xs font-medium text-slate-700" dateTime={notification.created_at}>
                          {new Date(notification.created_at).toLocaleString()}
                        </time>
                      </div>
                      {shouldShowTitle ? <p className="mt-1 text-sm font-semibold text-slate-900">{notification.title}</p> : null}
                      <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
                      {isUnread ? <p className="mt-2 text-xs font-semibold text-teal-900">Unread update</p> : null}
                    </article>
                  </li>
                );
              })
            ) : (
              <li className="rounded-[1rem] border border-slate-200 bg-white p-4 text-sm text-slate-700">
                No updates yet. New accepted/rejected decisions and completed events will appear here.
              </li>
            )}
          </ul>
        </section>

        <section className="paper-panel rounded-[1.6rem] p-4 sm:p-5" aria-labelledby="event-notes-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="event-notes-heading" className="display-font text-2xl font-semibold text-slate-900">Post-event notes</h2>
              <p className="mt-1 text-sm text-slate-700">Share practical advice with future volunteers after completed events.</p>
            </div>
            <p className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800" role="status" aria-live="polite">
              {eventNoteDrafts.length > 0 ? `${eventNoteDrafts.length} events ready for notes` : "No eligible completed events yet"}
            </p>
          </div>

          {noteStatusMessage ? (
            <p
              className={cn(
                "mt-4 rounded-[1rem] border px-3 py-2 text-sm font-semibold",
                noteStatusMessage.tone === "success"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-amber-300 bg-amber-50 text-amber-900"
              )}
              role="status"
              aria-live="polite"
            >
              {noteStatusMessage.text}
            </p>
          ) : null}

          {eventNoteDrafts.length > 0 ? (
            <ul className="mt-4 space-y-3" aria-label="Post-event notes list">
              {eventNoteDrafts.map((draftItem) => {
                const textareaId = `event-note-${draftItem.applicationId}`;

                return (
                  <li key={`${draftItem.orgId}-${draftItem.eventName}`}>
                    <article className="rounded-[1rem] border border-slate-200 bg-white p-3 sm:p-4">
                      <p className="text-sm font-semibold text-slate-900">{draftItem.eventName}</p>
                      <p className="mt-1 text-sm text-slate-700">Organization: {draftItem.organizationName || "Organization"}</p>

                      <form action={submitVolunteerEventNote} className="mt-3 space-y-2">
                        <input type="hidden" name="orgId" value={draftItem.orgId} />
                        <input type="hidden" name="eventName" value={draftItem.eventName} />

                        <label htmlFor={textareaId} className="block text-sm font-semibold text-slate-900">
                          Your note for future volunteers
                        </label>
                        <textarea
                          id={textareaId}
                          name="noteText"
                          defaultValue={draftItem.existingNote}
                          rows={4}
                          required
                          minLength={8}
                          placeholder="Example: I spent 2 hours on intake; it was faster to group supplies by task first."
                          className="input-shell min-h-28"
                        />

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-600">Keep it practical: timing, setup, and what worked well.</p>
                          <button type="submit" className="primary-action rounded-full px-4 py-2 text-xs font-semibold">
                            {draftItem.existingNote ? "Update note" : "Save note"}
                          </button>
                        </div>
                      </form>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-[1rem] border border-slate-200 bg-white p-4 text-sm text-slate-700">
              Once you complete an accepted event and attendance is recorded, you can add notes here for future volunteers.
            </p>
          )}
        </section>

        <VolunteerApplicationsTabs
          initialTab={initialTab as "applied" | "accepted" | "rejected" | "past"}
          appliedItems={appliedItems}
          acceptedItems={acceptedItems}
          rejectedItems={rejectedItems}
          pastItems={pastViewItems}
        />
      </div>
    </main>
  );
}
