export const AI_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;

export type AIStatus = (typeof AI_STATUSES)[number];
