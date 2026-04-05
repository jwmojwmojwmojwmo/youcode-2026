import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OrgHeaderNav from "@/app/org/_components/OrgHeaderNav";
import ReloadButton from "@/components/ReloadButton";
import { cn } from "@/lib/utils";
import type { OrganizationEvent } from "@/types/organization";
import { markOrganizationNotificationsAsRead } from "./actions";
import OrgEventsTabs from "./OrgEventsTabs";

type OrgEventRow = OrganizationEvent & {
  event_applications: { id: string; status: string }[];
};

type OrganizationNotificationItem = {
  id: string;
  kind: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

function getOrganizationNotificationTypeLabel(kind: string) {
  switch (kind) {
    case "new_application":
      return "New applicant";
    default:
      return "Update";
  }
}

export default async function OrganizationEventsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-8">
        <div className="paper-panel rounded-[1.75rem] p-6">
          <p className="kicker">Organization access</p>
          <h1 className="display-font mt-2 text-3xl font-semibold text-slate-900">Sign in to view events</h1>
          <p className="mt-2 text-sm text-slate-600">You need an organization account to open this page.</p>
          <Link href="/org/login" className="mt-4 inline-flex rounded-full primary-action px-4 py-2 text-sm font-semibold">
            Go to organization login
          </Link>
        </div>
      </main>
    );
  }

  const { data: eventsData } = await supabase
    .from("events")
    .select("id, title, address, status, created_at, max_volunteers, skills_needed, event_applications(id, status)")
    .eq("org_id", user.id)
    .order("created_at", { ascending: false });

  const events = (eventsData ?? []) as OrgEventRow[];
  const { data: notificationsData, error: notificationsError } = await supabase
    .from("organization_notifications")
    .select("id, kind, title, message, created_at, read_at")
    .eq("org_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  const notifications = notificationsError
    ? []
    : (notificationsData ?? []) as OrganizationNotificationItem[];
  const unreadNotificationsCount = notifications.filter((notification) => !notification.read_at).length;

  const presentEvents = events.filter((event) => {
    const status = event.status.toLowerCase();
    return status === "recruiting" || status === "ongoing";
  });
  const pastEvents = events.filter((event) => event.status.toLowerCase() === "completed");

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="paper-panel rounded-[1.6rem] px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <OrgHeaderNav isSignedIn={Boolean(user)} />
            <ReloadButton label="Refresh events" />
          </div>
        </section>

        <section className="paper-panel rounded-[1.6rem] p-4 sm:p-5" aria-labelledby="org-updates-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="org-updates-heading" className="display-font text-2xl font-semibold text-slate-900">Applicant updates</h2>
              <p className="mt-1 text-sm text-slate-700">New volunteer applications appear here so you can review quickly.</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800" role="status" aria-live="polite">
                {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread` : "All caught up"}
              </p>
              <form action={markOrganizationNotificationsAsRead}>
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
            </div>
          </div>

          <ul className="mt-4 space-y-3" aria-label="Applicant notification list">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const isUnread = !notification.read_at;
                const typeLabel = getOrganizationNotificationTypeLabel(notification.kind);
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
                        <p className="text-sm font-semibold text-slate-900">{typeLabel}</p>
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
                No applicant updates yet. New applications will appear here.
              </li>
            )}
          </ul>
        </section>

        <OrgEventsTabs presentEvents={presentEvents} pastEvents={pastEvents} />
      </div>
    </main>
  );
}
