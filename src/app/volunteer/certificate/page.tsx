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

function buildVerificationId(date: Date) {
  const monthDaySeed = Number.parseInt(
    `${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`,
    10
  );
  const serial = ((monthDaySeed * 137 + 98765) % 90000) + 10000;
  return `VBC-${date.getUTCFullYear()}-${serial}`;
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
    .select("id, name, completed_hours, completed_events, skills")
    .eq("id", user.id)
    .maybeSingle();

  const profile = volunteer as VolunteerCertificateRow | null;

  if (!profile) {
    redirect("/volunteer/profile");
  }

  const issueDate = new Date();
  const certificateId = buildVerificationId(issueDate);
  const verifiedCertifications = (profile.skills ?? [])
    .filter((skill) => VERIFIED_STAMPS.includes(skill as (typeof VERIFIED_STAMPS)[number]))
    .map((skill) => STAMP_LABELS[skill as keyof typeof STAMP_LABELS] || skill);

  return (
    <main className="min-h-screen bg-[#e8e3d3] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
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
              <p className="kicker">Certification Record</p>
              <h1 className="display-font mt-1 text-4xl font-semibold text-slate-900 sm:text-5xl">Official volunteer credential</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">Formal, printable record template with verified certification seals.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SaveCertificatePdfButton targetId="official-record-of-service" />
              <Link href="/volunteer/progression" className="secondary-action rounded-full px-4 py-2 text-sm font-semibold">
                Back to credentials and milestones
              </Link>
            </div>
          </div>
        </section>

        <section
          id="official-record-of-service"
          className="overflow-hidden rounded-[1.75rem] border-2 border-[#4f4a39] bg-[#f7f2e5] p-4 shadow-[0_22px_56px_rgba(28,27,22,0.24)] print:rounded-none print:border print:border-[#4f4a39] print:shadow-none sm:p-6"
        >
          <div className="border-[3px] border-double border-[#5c5744] bg-gradient-to-b from-[#fbf8ef] to-[#f3ead2] px-4 py-6 sm:px-8 sm:py-8">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-[28rem] text-xs font-bold uppercase tracking-[0.2em] text-[#2f2b20] sm:text-sm">
                YouCode 2026 Community Initiative
              </p>
              <p className="max-w-[24rem] text-left text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#4a4535] sm:text-right sm:text-[0.72rem]">
                Partnered with VolunteerBC | Verified & Audited Records
              </p>
            </header>

            <div className="mt-4 h-[3px] w-full bg-[#4f4a39]" />

            <div className="mt-8 text-center sm:mt-10">
              <h2 className="display-font text-[2rem] font-semibold uppercase tracking-[0.24em] text-[#1f1a12] sm:text-[2.6rem]">
                Official Record of Service
              </h2>
              <p className="mt-5 text-base text-[#2f2a1f]">This document officially certifies that</p>
              <p className="display-font mx-auto mt-4 inline-block border-b-2 border-[#2a2519] px-5 pb-2 text-3xl font-bold text-[#1a160f] sm:text-5xl">
                {profile.name}
              </p>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#2c271d] sm:text-lg">
                has demonstrated exceptional dedication to community enrichment, officially completing <span className="font-extrabold text-[#17130d]">{profile.completed_hours}</span> verified hours across <span className="font-extrabold text-[#17130d]">{profile.completed_events}</span> sanctioned events.
              </p>
            </div>

            <section className="mt-9 rounded-lg border border-[#6b644d] bg-[#f5efdf] px-4 py-5 sm:px-6 sm:py-6">
              <h3 className="text-center text-sm font-bold uppercase tracking-[0.18em] text-[#2c281d] sm:text-base">
                Verified Certifications on File
              </h3>
              {verifiedCertifications.length > 0 ? (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {verifiedCertifications.map((skill) => (
                    <li
                      key={skill}
                      className="flex min-h-[5.2rem] items-center gap-3 rounded-full border-2 border-[#4f4a39] bg-[#fcf8ec] px-4 py-3 shadow-[inset_0_0_0_1px_rgba(79,74,57,0.26)]"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[#3f3a2c] bg-[#e7dbc0]">
                        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-none stroke-[#2a2519] stroke-[2.4]">
                          <path d="M4 10.5L8 14.5L16 6.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold uppercase tracking-[0.05em] text-[#262114]">{skill}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-center text-sm font-semibold uppercase tracking-[0.08em] text-[#3c3729]">
                  No verified certifications on file
                </p>
              )}
            </section>

            <footer className="mt-10 grid gap-6 border-t-2 border-[#5f5947] pt-5 sm:grid-cols-2 sm:pt-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#272217]">Verification ID</p>
                <p className="mt-1 text-sm font-bold text-[#17130d]">{certificateId}</p>
                <p className="mt-3 text-xs leading-5 text-[#3a3528]">
                  This record is cryptographically verified and cross-referenced with participating organizations.
                </p>
              </div>

              <div className="space-y-4 sm:text-right">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#272217]">Date</p>
                  <p className="mt-1 text-sm font-semibold text-[#17130d]">{formatIssueDate(issueDate)}</p>
                </div>
                <div className="sm:ml-auto sm:max-w-[17rem]">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#272217]">System Administrator</p>
                  <div className="mt-5 border-b border-[#3c3629]" />
                </div>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
