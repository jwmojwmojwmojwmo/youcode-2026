"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { saveEventAttendance, type AttendanceActionState } from "./actions";

type AttendanceUpdateFormProps = {
  eventId: string;
  applicationId: string;
  initialAttended: boolean;
  initialRating: number | null;
};

const INITIAL_STATE: AttendanceActionState = {
  status: "idle",
  message: ""
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="primary-action w-full rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save update"}
    </button>
  );
}

export default function AttendanceUpdateForm({
  eventId,
  applicationId,
  initialAttended,
  initialRating
}: AttendanceUpdateFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveEventAttendance, INITIAL_STATE);
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent">(
    initialAttended ? "present" : "absent"
  );
  const [rating, setRating] = useState<string>(initialRating ? String(initialRating) : "");
  const [isEditing, setIsEditing] = useState<boolean>(!(initialAttended || initialRating !== null));

  useEffect(() => {
    if (state.status === "success") {
      setIsEditing(false);
      router.refresh();
    }
  }, [router, state.status]);

  const hasRecordedValue = useMemo(() => {
    return attendanceStatus === "present" || rating !== "";
  }, [attendanceStatus, rating]);

  if (!isEditing && hasRecordedValue) {
    return (
      <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-700">
            <p>
              Attendance: <span className="font-medium text-gray-900">{attendanceStatus === "present" ? "Present" : "Absent"}</span>
            </p>
            <p>
              Event rating: <span className="font-medium text-gray-900">{rating || "No rating"}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="secondary-action rounded-full px-3 py-2 text-sm font-semibold"
          >
            Edit attendance
          </button>
        </div>

        {state.status !== "idle" ? (
          <p
            className={`mt-2 text-sm ${state.status === "success" ? "text-green-700" : "text-red-600"}`}
            role="status"
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 grid gap-3 rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 sm:grid-cols-3">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="applicationId" value={applicationId} />

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500" htmlFor={`attendance-${applicationId}`}>
          Attendance
        </label>
        <select
          id={`attendance-${applicationId}`}
          name="attendanceStatus"
          value={attendanceStatus}
          onChange={(event) => setAttendanceStatus(event.target.value as "present" | "absent")}
          className="input-shell mt-2"
        >
          <option value="present">Present (showed up)</option>
          <option value="absent">Absent / did not show</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500" htmlFor={`rating-${applicationId}`}>
          Rating
        </label>
        <select
          id={`rating-${applicationId}`}
          name="orgRating"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          disabled={attendanceStatus !== "present"}
          className="input-shell mt-2"
        >
          <option value="">No rating yet</option>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Average</option>
          <option value="2">2 - Needs improvement</option>
          <option value="1">1 - Poor</option>
        </select>
      </div>

      <div className="flex items-end">
        <SaveButton />
      </div>

      <div className="sm:col-span-3">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="secondary-action rounded-full px-3 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>

      {state.status !== "idle" ? (
        <p
          className={`sm:col-span-3 text-sm ${
            state.status === "success" ? "text-green-700" : "text-red-600"
          }`}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
