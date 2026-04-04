import { createOrganizationEvent } from "@/app/org/actions";
import { STAMP_LABELS, STAMPS } from "@/lib/stamps";
import TagSelector from "./TagSelector";

type EventFormProps = {
  existingTags: string[];
};

export default function EventForm({ existingTags }: EventFormProps) {
  const stampValues = Object.values(STAMPS);

  return (
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
  );
}
