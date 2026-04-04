export type OrganizationEvent = {
  id: string;
  title: string;
  address: string | null;
  status: string;
  created_at: string;
  max_volunteers: number;
  event_applications: { id: string; status: string }[];
};

export type ApplicationReview = {
  id: string;
  event_id: string;
  status: string;
  volunteers: {
    name: string;
    contact_email: string | null;
    skills: string[] | null;
    completed_hours: number;
    completed_events: number;
    rating: number;
  }[] | null;
};