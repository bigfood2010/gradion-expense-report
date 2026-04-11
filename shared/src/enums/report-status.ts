export const REPORT_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];
