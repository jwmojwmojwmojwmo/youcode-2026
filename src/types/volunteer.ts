export type EventCard = {
  id: string;
  title: string;
  description: string | null;
  address: string | null;
  hours_given: number;
  max_volunteers: number;
  organizations: { name: string } | null;
  event_applications: { id: string; status: string }[];
};

export type VolunteerProfile = {
  name: string;
  skills: string[] | null;
  completed_hours: number;
  completed_events: number;
  contact_email: string | null;
};

export type VolunteerApplication = {
  id: string;
  event_id: string;
  status: string;
  applied_at?: string;
  events: {
    title: string;
  }[] | null;
};