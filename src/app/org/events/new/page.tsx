import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationEvent } from "../../actions";
import { STAMP_LABELS, STAMPS } from "@/lib/stamps";
import TagSelector from "./TagSelector";

type NewEventPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewOrganizationEventPage({ searchParams }: NewEventPageProps) {
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

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const stampValues = Object.values(STAMPS);
  const { data: existingTagRows } = await supabase.from("tags").select("name").order("name", { ascending: true });
  const existingTags = (existingTagRows ?? []).map((row) => row.name);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Create New Event</h1>
          <Link href="/org" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">
            Back to dashboard
          </Link>
        </div>

        {resolvedSearchParams?.error ? (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{resolvedSearchParams.error}</p>
        ) : null}

        <form action={createOrganizationEvent} className="grid gap-3">
          <input
            name="eventTitle"
            placeholder="Event title"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            name="eventDescription"
            placeholder="Event description"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="eventAddress"
            placeholder="Event address"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="volunteerHours"
            type="number"
            step="1"
            placeholder="Volunteer hours awarded"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="compensationOptions"
            placeholder="Compensation options (comma separated)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <TagSelector existingTags={existingTags} />
          <fieldset className="rounded-md border border-gray-300 p-3">
            <legend className="px-1 text-sm font-medium text-gray-900">Required skills</legend>
            <div className="mt-2 grid gap-2">
              {stampValues.map((stamp) => (
                <label key={stamp} className="flex items-center gap-2 text-sm text-gray-800">
                  <input name="requiredSkills" value={stamp} type="checkbox" />
                  <span>{STAMP_LABELS[stamp]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <input
            name="locationLatitude"
            type="number"
            step="any"
            placeholder="Location latitude"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="locationLongitude"
            type="number"
            step="any"
            placeholder="Location longitude"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="maxVolunteers"
            type="number"
            step="1"
            placeholder="Max volunteer spots"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />

          <button type="submit" className="mt-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
            Create event
          </button>
        </form>
      </div>
    </main>
  );
}
