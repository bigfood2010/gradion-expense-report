// UserRole lives in modules/users/domain/user-role.enum — import from there directly.
// AuthenticatedUser lives in common/request-context — import from there directly.

export enum ExpenseReportStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ExpenseItemAIStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
