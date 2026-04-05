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
import { clearVolunteerNotifications, markVolunteerNotificationsAsRead } from "./actions";
import VolunteerApplicationsTabs from "./volunteer-applications-tabs";

type VolunteerApplicationsPageProps = {
  searchParams?: Promise<{
    tab?: string;
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

  const eventMetaRows = (eventsData ?? []) as VolunteerApplicationEventMetaInput[];
  const applications = normalizeVolunteerApplications(
    (applicationsData ?? []) as VolunteerApplication[],
    buildEventMetaById(eventMetaRows)
  );
  const { currentApplications, pastApplications } = splitVolunteerApplicationsByEventStatus(applications);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tabParam = (resolvedSearchParams?.tab || "").toLowerCase();
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
