import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { acceptApplication, declineApplication, organizationSignOut } from "./actions";

type OrganizationEvent = {
  id: string;
  title: string;
  address: string | null;
  status: string;
  created_at: string;
  max_volunteers: number;
  event_applications: { id: string }[];
};

type ApplicationReview = {
  id: string;
  event_id: string;
  status: string;
  volunteers: { name: string; contact_email: string | null }[] | null;
};

export default async function OrganizationPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <main className="p-8">
        <Link href="/org/login" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
          Go to organization login
        </Link>
      </main>
    );
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, contact_email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: eventsData } = await supabase
    .from("events")
    .select("id, title, address, status, created_at, max_volunteers, event_applications(id)")
    .eq("org_id", user.id)
    .order("created_at", { ascending: false });

  const allEvents = (eventsData ?? []) as OrganizationEvent[];
  const currentEvents = allEvents.filter((event) => {
    const status = event.status.toLowerCase();
    return status === "recruiting" || status === "ongoing";
  });
  const eventIds = currentEvents.map((event) => event.id);

  const { data: applicationsData } = eventIds.length
    ? await supabase
        .from("event_applications")
        .select("id, event_id, status, volunteers(name, contact_email)")
        .in("event_id", eventIds)
        .order("applied_at", { ascending: false })
    : { data: [] };

  const applicationsByEvent = (applicationsData ?? []).reduce<Record<string, ApplicationReview[]>>((acc, item) => {
    const application = item as ApplicationReview;
    if (!acc[application.event_id]) {
      acc[application.event_id] = [];
    }
    acc[application.event_id].push(application);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">{organization?.name || "Organization"}</p>
          </div>
          <div className="flex gap-2">
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900">
                Current events
              </summary>
              <div className="absolute right-0 top-full z-10 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                {currentEvents.length > 0 ? (
                  <div className="space-y-2">
                    {currentEvents.map((event) => (
                      <div key={event.id} className="rounded-md border border-gray-200 px-3 py-2 text-xs">
                        <p className="font-semibold text-gray-800">{event.title}</p>
                        <p className="text-gray-600">Address: {event.address || "Not specified"}</p>
                        <p className="text-gray-600">Status: {event.status}</p>
                        <p className="text-gray-600">Applicants: {event.event_applications?.length ?? 0}</p>

                        <div className="mt-2 space-y-2">
                          {(applicationsByEvent[event.id] ?? []).length > 0 ? (
                            (applicationsByEvent[event.id] ?? []).map((application) => {
                              const volunteer = application.volunteers?.[0];
                              const isPendingReview =
                                application.status === "Applied" ||
                                application.status === "Waitlisted" ||
                                application.status === "Needs skill verification";

                              return (
                                <div key={application.id} className="rounded border border-gray-200 bg-gray-50 p-2">
                                  <p className="font-medium text-gray-800">{volunteer?.name || "Volunteer"}</p>
                                  <p className="text-gray-600">{volunteer?.contact_email || "No email"}</p>
                                  <p className="text-gray-600">Application status: {application.status}</p>

                                  {isPendingReview ? (
                                    <div className="mt-1 flex gap-1">
                                      <form action={acceptApplication}>
                                        <input type="hidden" name="applicationId" value={application.id} />
                                        <button
                                          type="submit"
                                          className="rounded border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-900"
                                        >
                                          Accept
                                        </button>
                                      </form>
                                      <form action={declineApplication}>
                                        <input type="hidden" name="applicationId" value={application.id} />
                                        <button
                                          type="submit"
                                          className="rounded border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-900"
                                        >
                                          Decline
                                        </button>
                                      </form>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500">No applications to review.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recruiting or ongoing events.</p>
                )}
              </div>
            </details>
            <Link href="/org/events/new" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
              Create new event
            </Link>
            <form action={organizationSignOut}>
              <button type="submit" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900">
                Log out
              </button>
            </form>
          </div>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">All hosted events</h2>
          <div className="mt-4 space-y-3">
            {allEvents.length > 0 ? (
              allEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-gray-200 p-3 text-sm">
                  <p className="font-semibold text-gray-900">{event.title}</p>
                  <p className="text-gray-600">Address: {event.address || "Not specified"}</p>
                  <p className="text-gray-600">Status: {event.status}</p>
                  <p className="text-gray-600">Applicants: {event.event_applications?.length ?? 0}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No events created yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
