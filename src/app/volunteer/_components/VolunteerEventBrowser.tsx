"use client";

import { useState, useMemo } from "react";
import VolunteerEventGrid from "./VolunteerEventGrid";
import { APPLICATION_STATUSES } from "@/lib/application-status";
import type { EventCard, VolunteerProfile } from "@/types/volunteer";

type SortOption = "recommended" | "alphabetical" | "most-volunteers" | "newest" | "hours-desc";

type VolunteerEventBrowserProps = {
  events: EventCard[];
  isSignedIn: boolean;
  profile: VolunteerProfile | null;
  applicationStatusByEvent: Map<string, string>;
};

function getRecommendedScore(event: EventCard, profile: VolunteerProfile | null) {
  if (!profile) {
    return 0;
  }

  const profileSkills = new Set((profile.skills ?? []).map((skill) => skill.toLowerCase()));
  const requiredSkills = (event.skills_needed ?? []).map((skill) => skill.toLowerCase());
  const matchedSkills = requiredSkills.filter((skill) => profileSkills.has(skill));
  const skillMatchScore = matchedSkills.length * 100;
  const experienceScore = Math.min(profile.completed_events, 50) * 4 + Math.min(profile.completed_hours, 200) * 0.5;
  const requirementScore = requiredSkills.length > 0 ? requiredSkills.length * 5 : 0;

  return skillMatchScore + experienceScore + requirementScore;
}

function getSortLabel(sortOption: SortOption) {
  switch (sortOption) {
    case "recommended":
      return "Recommended";
    case "alphabetical":
      return "Alphabetical";
    case "most-volunteers":
      return "Most volunteers";
    case "newest":
      return "Newest";
    case "hours-desc":
      return "Highest hours";
  }
}

export default function VolunteerEventBrowser({ events, isSignedIn, profile, applicationStatusByEvent }: VolunteerEventBrowserProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("recommended");

  const allAvailableTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach((event) => event.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [events]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((currentTag) => currentTag !== tag) : [...prev, tag]));
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const filteredEvents = useMemo(() => {
    const matchingEvents = events.filter((event) => {
      const searchContent = `${event.title} ${event.description} ${event.organizations?.name}`.toLowerCase();
      const matchesKeyword = !keyword || searchContent.includes(keyword.toLowerCase());

      const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => event.tags.includes(tag));

      return matchesKeyword && matchesTags;
    });

    switch (sortOption) {
      case "alphabetical":
        return [...matchingEvents].sort((a, b) => a.title.localeCompare(b.title));
      case "most-volunteers":
        return [...matchingEvents].sort((a, b) => {
          const aApproved = (a.event_applications || []).filter(
            (application) => application.status === APPLICATION_STATUSES.ACCEPTED
          ).length;
          const bApproved = (b.event_applications || []).filter(
            (application) => application.status === APPLICATION_STATUSES.ACCEPTED
          ).length;

          if (aApproved !== bApproved) {
            return bApproved - aApproved;
          }

          return a.title.localeCompare(b.title);
        });
      case "newest":
        return [...matchingEvents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "hours-desc":
        return [...matchingEvents].sort((a, b) => b.hours_given - a.hours_given || a.title.localeCompare(b.title));
      case "recommended":
      default:
        return [...matchingEvents].sort((a, b) => {
          const scoreDifference = getRecommendedScore(b, profile) - getRecommendedScore(a, profile);
          if (scoreDifference !== 0) {
            return scoreDifference;
          }

          return a.title.localeCompare(b.title);
        });
    }
  }, [events, keyword, selectedTags, sortOption, profile]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-gray-900">Find by Keyword or Tag</label>
          <input
            type="text"
            placeholder="Search titles, descriptions, orgs..."
            value={keyword}
            onChange={handleKeywordChange}
            className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          
          <div className="flex flex-wrap gap-2">
            {allAvailableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label htmlFor="sort-events" className="mb-2 block text-sm font-semibold text-gray-900">
            Sort events
          </label>
          <p className="mb-3 text-xs text-gray-600">
            Recommended uses your skills and experience. Other sorts let you scan by title, capacity, or hours.
          </p>
          <select
            id="sort-events"
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value as SortOption)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="recommended">{getSortLabel("recommended")}</option>
            <option value="alphabetical">{getSortLabel("alphabetical")}</option>
            <option value="most-volunteers">{getSortLabel("most-volunteers")}</option>
            <option value="hours-desc">{getSortLabel("hours-desc")}</option>
            <option value="newest">{getSortLabel("newest")}</option>
          </select>
        </div>
      </div>

      <hr className="border-gray-200" />

      <VolunteerEventGrid
        events={filteredEvents}
        isSignedIn={isSignedIn}
        applicationStatusByEvent={applicationStatusByEvent}
      />
    </div>
  );
}