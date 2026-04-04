export const APPLICATION_STATUSES = {
  APPLIED: "Applied",
  WAITLISTED: "Waitlisted",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  NEEDS_SKILL_VERIFICATION: "Needs skill verification",
  WITHDRAWN: "Withdrawn"
} as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[keyof typeof APPLICATION_STATUSES];

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  [APPLICATION_STATUSES.APPLIED]: "Pending review",
  [APPLICATION_STATUSES.WAITLISTED]: "On waitlist",
  [APPLICATION_STATUSES.ACCEPTED]: "Approved",
  [APPLICATION_STATUSES.DECLINED]: "Not accepted",
  [APPLICATION_STATUSES.NEEDS_SKILL_VERIFICATION]: "Needs skill verification",
  [APPLICATION_STATUSES.WITHDRAWN]: "Withdrawn"
};

export function isPendingOrgReviewStatus(status: string): boolean {
  return (
    status === APPLICATION_STATUSES.APPLIED ||
    status === APPLICATION_STATUSES.WAITLISTED ||
    status === APPLICATION_STATUSES.NEEDS_SKILL_VERIFICATION
  );
}

export function getApplicationStatusLabel(status: string): string {
  return APPLICATION_STATUS_LABELS[status] || status;
}