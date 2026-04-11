import type { AIStatus, ReportStatus, UserRole } from '@gradion/shared/enums';

let sequence = 0;

function nextSequence(): number {
  sequence += 1;
  return sequence;
}

export function createUserFixture(
  overrides: Partial<{
    email: string;
    passwordHash: string;
    role: UserRole;
  }> = {},
) {
  const id = nextSequence();

  return {
    email: overrides.email ?? `user-${id}@example.com`,
    passwordHash: overrides.passwordHash ?? 'hashed-password',
    role: overrides.role ?? 'user',
  };
}

export function createReportFixture(
  overrides: Partial<{
    title: string;
    description: string | null;
    status: ReportStatus;
    currency: string;
  }> = {},
) {
  return {
    title: overrides.title ?? 'April expense report',
    description: overrides.description ?? 'Assessment happy-path report',
    status: overrides.status ?? 'DRAFT',
    currency: overrides.currency ?? 'USD',
  };
}

export function createItemFixture(
  overrides: Partial<{
    merchant: string;
    description: string | null;
    amount: number;
    currency: string;
    category: string | null;
    date: string;
    receiptUrl: string | null;
    aiStatus: AIStatus;
    aiExtracted: boolean;
  }> = {},
) {
  return {
    merchant: overrides.merchant ?? 'Station Cafe',
    description: overrides.description ?? 'Client lunch',
    amount: overrides.amount ?? 42.5,
    currency: overrides.currency ?? 'USD',
    category: overrides.category ?? 'Meals',
    date: overrides.date ?? '2026-04-10',
    receiptUrl: overrides.receiptUrl ?? 'receipts/station-cafe.pdf',
    aiStatus: overrides.aiStatus ?? 'COMPLETED',
    aiExtracted: overrides.aiExtracted ?? true,
  };
}
