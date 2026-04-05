import { createClient } from "@/lib/supabase/server";
import type { EventCard, VolunteerApplication, VolunteerProfile } from "@/types/volunteer";
import { buildEventMetaById, normalizeVolunteerApplications } from "@/lib/volunteer-application-utils";
import ReloadButton from "@/components/ReloadButton";
import VolunteerHeaderMenus from "./volunteer/_components/VolunteerHeaderMenus";
import VolunteerEventBrowser from "./volunteer/_components/VolunteerEventBrowser";

type EventQueryRow = Omit<EventCard, "tags"> & {
  event_tags?: { tags?: { name: string | null } | null }[] | null;
};

export default async function Home() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const { data: profileData } = user
    ? await supabase
        .from("volunteers")
        .select("name, skills, completed_hours, completed_events, contact_email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const profile: VolunteerProfile | null = profileData;

  const { data: eventsData, error } = await supabase
    .from("events")
    .select(`
      *,
      organizations ( id, name ),
      event_applications ( id, status ),
      event_tags ( tags ( name ) )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching events:", error);
    return (
      <div className="p-8 text-red-600 bg-red-50">
        Failed to load events. <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  const rawEvents = (eventsData ?? []) as EventQueryRow[];
  const formattedEvents: EventCard[] = rawEvents.map((event) => {
    const tags = (event.event_tags ?? [])
      .map((eventTag) => eventTag.tags?.name)
      .filter((tag): tag is string => Boolean(tag));

    return {
      ...event,
      tags
    };
  });

  const eventMetaById = buildEventMetaById(formattedEvents);

  const { data: applicationsData } = user
    ? await supabase
        .from("event_applications")
        .select("id, event_id, status, attended, applied_at, events(title, status, hours_given)")
        .eq("volunteer_id", user.id)
        .order("applied_at", { ascending: false })
    : { data: [] };
  const myApplications = normalizeVolunteerApplications((applicationsData ?? []) as VolunteerApplication[], eventMetaById);
  const applicationStatusByEvent = new Map(myApplications.map((application) => [application.event_id, application.status]));

  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-[1700px] space-y-4">
        <header className="paper-panel relative z-40 rounded-[1.6rem] px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="kicker">Volunteer, volunteering page</p>
              <h1 className="display-font mt-1 break-words text-3xl font-semibold text-slate-900 sm:text-4xl">Volunteer atlas</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <ReloadButton label="Refresh atlas" />
              <VolunteerHeaderMenus
                isSignedIn={Boolean(user)}
                userEmail={user?.email}
                profile={profile}
                myApplications={myApplications}
              />
            </div>
          </div>
        </header>

        <VolunteerEventBrowser
          events={formattedEvents.filter((event) => event.status.toLowerCase() !== "completed")}
          isSignedIn={Boolean(user)}
          profile={profile}
          applicationStatusByEvent={applicationStatusByEvent}
        />
      </div>
    </main>
  );
}