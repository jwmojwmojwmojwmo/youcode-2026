import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventForm from "./EventForm";

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

        <EventForm existingTags={existingTags} />
      </div>
    </main>
  );
}
