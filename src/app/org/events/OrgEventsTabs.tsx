"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUSES } from "@/lib/application-status";
import type { OrganizationEvent } from "@/types/organization";

type OrgEventRow = OrganizationEvent & {
  event_applications: { id: string; status: string }[];
};

type OrgEventNoteItem = {
  id: string;
  volunteerName: string;
  noteText: string;
  createdAt: string;
};

type OrgEventsTabsProps = {
  presentEvents: OrgEventRow[];
  pastEvents: OrgEventRow[];
  eventNotesByEventName: Record<string, OrgEventNoteItem[]>;
};

function toEventNameKey(eventName: string) {
  return eventName.trim().toLowerCase();
}

export default function OrgEventsTabs({ presentEvents, pastEvents, eventNotesByEventName }: OrgEventsTabsProps) {
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

  return (
    <section className="paper-panel rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display-font text-3xl font-semibold text-slate-900">My Events</h2>
        </div>

        <Link href="/org/events/new" className="primary-action rounded-full px-4 py-2 text-sm font-semibold">
          Add event
        </Link>
      </div>

      <div className="mt-4">
        <div className="flex rounded-full border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            aria-current={activeTab === "current" ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition min-w-[8.5rem]",
              activeTab === "current" ? "primary-action" : "secondary-action"
            )}
          >
            Current
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            aria-current={activeTab === "past" ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition min-w-[8.5rem]",
              activeTab === "past" ? "primary-action" : "secondary-action"
            )}
          >
            Past
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {activeTab === "current" ? (
          presentEvents.length > 0 ? (
            presentEvents.map((event) => {
              const approvedCount = (event.event_applications ?? []).filter((application) => application.status === APPLICATION_STATUSES.ACCEPTED).length;
              const appliedCount = (event.event_applications ?? []).filter((application) => (
                application.status === APPLICATION_STATUSES.APPLIED
                || application.status === APPLICATION_STATUSES.WAITLISTED
                || application.status === APPLICATION_STATUSES.NEEDS_SKILL_VERIFICATION
              )).length;

              return (
                <article key={event.id} className="rounded-[1.35rem] border border-slate-200 bg-white/85 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="display-font text-xl font-semibold text-slate-900">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-600">Status: {event.status}</p>
                      <p className="mt-1 text-sm text-slate-600">Address: {event.address || "Not specified"}</p>
                    </div>
                    <Link href={`/org/events/${event.id}`} className="rounded-full primary-action px-4 py-2 text-sm font-semibold">
                      Manage event
                    </Link>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="stamp-pill rounded-full px-3 py-1">{appliedCount} applied</span>
                    <span className="stamp-pill rounded-full px-3 py-1">{approvedCount} accepted</span>
                    <span className="stamp-pill rounded-full px-3 py-1">{event.max_volunteers} capacity</span>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="text-sm text-slate-600">No current events right now.</p>
          )
        ) : pastEvents.length > 0 ? (
          pastEvents.map((event) => {
            const attendedCount = (event.event_applications ?? []).filter((application) => application.status === APPLICATION_STATUSES.ACCEPTED).length;
            const appliedCount = (event.event_applications ?? []).filter((application) => (
              application.status === APPLICATION_STATUSES.APPLIED
              || application.status === APPLICATION_STATUSES.WAITLISTED
              || application.status === APPLICATION_STATUSES.NEEDS_SKILL_VERIFICATION
            )).length;
            const eventNotes = eventNotesByEventName[toEventNameKey(event.title)] ?? [];

            return (
              <article key={event.id} className="rounded-[1.35rem] border border-slate-200 bg-white/85 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="display-font text-xl font-semibold text-slate-900">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-600">Status: {event.status}</p>
                    <p className="mt-1 text-sm text-slate-600">Address: {event.address || "Not specified"}</p>
                  </div>
                  <Link href={`/org/events/${event.id}`} className="rounded-full secondary-action px-4 py-2 text-sm font-semibold">
                    View details
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="stamp-pill rounded-full px-3 py-1">{appliedCount} applied</span>
                  <span className="stamp-pill rounded-full px-3 py-1">{attendedCount} accepted</span>
                  <span className="stamp-pill rounded-full px-3 py-1">{eventNotes.length} volunteer notes</span>
                  <span className="stamp-pill rounded-full px-3 py-1">Completed</span>
                </div>

                <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Volunteer notes</p>
                  {eventNotes.length > 0 ? (
                    <ul className="mt-2 space-y-2" aria-label={`Volunteer notes for ${event.title}`}>
                      {eventNotes.map((note) => (
                        <li key={note.id} className="rounded-[0.8rem] border border-slate-200 bg-white p-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">From {note.volunteerName}</p>
                            <time className="text-xs text-slate-500" dateTime={note.createdAt}>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </time>
                          </div>
                          <p className="mt-1 text-sm text-slate-700">{note.noteText}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">No volunteer notes for this event yet.</p>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <p className="text-sm text-slate-600">No past events yet.</p>
        )}
      </div>
    </section>
  );
}