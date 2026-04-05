import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VolunteerHeaderMenus from "@/app/volunteer/_components/VolunteerHeaderMenus";
import ReloadButton from "@/components/ReloadButton";
import { STAMP_LABELS, VERIFIED_STAMPS } from "@/lib/stamps";
import SaveCertificatePdfButton from "./SaveCertificatePdfButton";

type VolunteerCertificateRow = {
  id: string;
  name: string;
  contact_email: string | null;
  completed_hours: number;
  completed_events: number;
  skills: string[] | null;
};

function formatIssueDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export default async function VolunteerCertificatePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect("/login");
  }

  const { data: volunteer } = await supabase
    .from("volunteers")
    .select("id, name, contact_email, completed_hours, completed_events, skills")
    .eq("id", user.id)
    .maybeSingle();

  const profile = volunteer as VolunteerCertificateRow | null;

  if (!profile) {
    redirect("/volunteer/profile");
  }

  const issueDate = new Date();
  const verifiedSkills = (profile.skills ?? []).filter((skill) => VERIFIED_STAMPS.includes(skill as (typeof VERIFIED_STAMPS)[number]));
  const certificateId = `YC-${profile.id.slice(0, 8).toUpperCase()}-${issueDate.getFullYear()}`;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="paper-panel rounded-[1.6rem] px-4 py-4 sm:px-5 sm:py-5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <VolunteerHeaderMenus isSignedIn={Boolean(user)} />
            <ReloadButton label="Refresh" />
          </div>
        </section>

        <section className="paper-panel-strong rounded-[2rem] p-5 sm:p-7 print:hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="kicker">Certificate</p>
              <h1 className="display-font mt-1 text-4xl font-semibold text-slate-900 sm:text-5xl">Official record of service</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">Use this page as an official volunteer service record for universities and employers.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SaveCertificatePdfButton />
              <Link href="/volunteer/progression" className="secondary-action rounded-full px-4 py-2 text-sm font-semibold">
                Back to credentials and milestones
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border-2 border-slate-300 bg-white p-6 shadow-[0_24px_64px_rgba(20,33,46,0.14)] print:rounded-none print:border print:border-slate-500 print:shadow-none sm:p-8">
          <div className="border border-slate-300 p-6 print:border-slate-500 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">YouCode community verification</p>
            <h2 className="display-font mt-2 text-4xl font-semibold text-slate-900">Official Record of Service</h2>

            <p className="mt-6 text-base leading-7 text-slate-800">
              This certifies that <span className="font-semibold">{profile.name}</span> has completed verified volunteer service through YouCode.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Volunteer name</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{profile.name}</p>
              </div>
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Contact email</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 break-words">{profile.contact_email || user.email || "No email listed"}</p>
              </div>
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total service hours</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{profile.completed_hours}</p>
              </div>
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Completed events</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{profile.completed_events}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1rem] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Verified certifications</p>
              {verifiedSkills.length > 0 ? (
                <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm text-slate-800 sm:grid-cols-2">
                  {verifiedSkills.map((skill) => (
                    <li key={skill}>{STAMP_LABELS[skill as keyof typeof STAMP_LABELS] || skill}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-700">No verified certifications listed.</p>
              )}
            </div>

            <div className="mt-8 grid gap-4 border-t border-slate-300 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Issue date</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatIssueDate(issueDate)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Certificate ID</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{certificateId}</p>
              </div>
            </div>

            <p className="mt-5 text-xs text-slate-600">
              Generated from official volunteer records stored in YouCode.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
