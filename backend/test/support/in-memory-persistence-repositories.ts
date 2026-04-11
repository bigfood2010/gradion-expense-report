import { randomUUID } from 'crypto';

import { getRepositoryToken } from '@nestjs/typeorm';
import type { Provider } from '@nestjs/common';

import type { AIStatus, ReportStatus, UserRole } from '@gradion/shared/enums';

import {
  ExpenseItemEntity,
  ExpenseReportEntity,
  UserEntity,
} from '@backend/infrastructure/persistence';

type FindOneOrFailOptions = {
  where?: {
    id?: string;
  };
};

type UserSnapshot = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

type ReportSnapshot = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: ReportStatus;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

type ItemSnapshot = {
  id: string;
  reportId: string;
  merchant: string;
  description: string | null;
  amount: number;
  currency: string;
  category: string | null;
  date: string;
  receiptUrl: string | null;
  aiStatus: AIStatus;
  aiExtracted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface PersistenceTestState {
  users: Map<string, UserSnapshot>;
  reports: Map<string, ReportSnapshot>;
  items: Map<string, ItemSnapshot>;
}

export function createPersistenceTestState(): PersistenceTestState {
  return {
    users: new Map<string, UserSnapshot>(),
    reports: new Map<string, ReportSnapshot>(),
    items: new Map<string, ItemSnapshot>(),
  };
}

function createStoredUser(input: Partial<UserEntity>, now: Date): UserSnapshot {
  return {
    id: input.id ?? randomUUID(),
    email: input.email ?? 'user@example.com',
    passwordHash: input.passwordHash ?? 'hashed-password',
    role: input.role ?? 'user',
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

function createStoredReport(input: Partial<ExpenseReportEntity>, now: Date): ReportSnapshot {
  return {
    id: input.id ?? randomUUID(),
    userId: input.userId ?? input.user?.id ?? randomUUID(),
    title: input.title ?? 'Untitled report',
    description: input.description ?? null,
    status: input.status ?? 'DRAFT',
    currency: input.currency ?? 'USD',
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

function createStoredItem(input: Partial<ExpenseItemEntity>, now: Date): ItemSnapshot {
  return {
    id: input.id ?? randomUUID(),
    reportId: input.reportId ?? input.report?.id ?? randomUUID(),
    merchant: input.merchant ?? 'Unknown merchant',
    description: input.description ?? null,
    amount: input.amount ?? 0,
    currency: input.currency ?? 'USD',
    category: input.category ?? null,
    date: input.date ?? now.toISOString().slice(0, 10),
    receiptUrl: input.receiptUrl ?? null,
    aiStatus: input.aiStatus ?? 'PENDING',
    aiExtracted: input.aiExtracted ?? false,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

function hydrateUser(snapshot: UserSnapshot): UserEntity {
  return Object.assign(new UserEntity(), snapshot);
}

function hydrateReport(state: PersistenceTestState, snapshot: ReportSnapshot): ExpenseReportEntity {
  const report = Object.assign(new ExpenseReportEntity(), snapshot);
  const user = state.users.get(snapshot.userId);

  if (!user) {
    throw new Error(`User not found for report ${snapshot.id}`);
  }

  report.user = hydrateUser(user);
  report.items = Array.from(state.items.values())
    .filter((item) => item.reportId === snapshot.id)
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
    .map((item) => hydrateItem(item));
  report.recalculateTotalAmount();

  return report;
}

function hydrateItem(snapshot: ItemSnapshot): ExpenseItemEntity {
  const item = Object.assign(new ExpenseItemEntity(), snapshot);
  item.report = Object.assign(new ExpenseReportEntity(), { id: snapshot.reportId });

  return item;
}

function createUserRepository(state: PersistenceTestState) {
  return {
    create(input: Partial<UserEntity>): UserEntity {
      return Object.assign(new UserEntity(), input);
    },
    async save(input: Partial<UserEntity>): Promise<UserEntity> {
      const now = new Date();
      const snapshot = createStoredUser(input, now);

      state.users.set(snapshot.id, snapshot);
      return hydrateUser(snapshot);
    },
  };
}

function createReportRepository(state: PersistenceTestState) {
  return {
    create(input: Partial<ExpenseReportEntity>): ExpenseReportEntity {
      return Object.assign(new ExpenseReportEntity(), input);
    },
    async save(input: Partial<ExpenseReportEntity>): Promise<ExpenseReportEntity> {
      const now = new Date();
      const snapshot = createStoredReport(input, now);

      state.reports.set(snapshot.id, snapshot);
      return hydrateReport(state, snapshot);
    },
    async findOneOrFail(options: FindOneOrFailOptions): Promise<ExpenseReportEntity> {
      const reportId = options.where?.id;

      if (!reportId) {
        throw new Error('Report id is required.');
      }

      const snapshot = state.reports.get(reportId);

      if (!snapshot) {
        throw new Error(`Report not found: ${reportId}`);
      }

      return hydrateReport(state, snapshot);
    },
  };
}

function createItemRepository(state: PersistenceTestState) {
  return {
    create(input: Partial<ExpenseItemEntity>): ExpenseItemEntity {
      return Object.assign(new ExpenseItemEntity(), input);
    },
    async save(input: Partial<ExpenseItemEntity>): Promise<ExpenseItemEntity> {
      const now = new Date();
      const snapshot = createStoredItem(input, now);

      state.items.set(snapshot.id, snapshot);
      return hydrateItem(snapshot);
    },
  };
}

export function createPersistenceRepositoryProviders(): Provider[] {
  const state = createPersistenceTestState();

  return [
    {
      provide: getRepositoryToken(UserEntity),
      useValue: createUserRepository(state),
    },
    {
      provide: getRepositoryToken(ExpenseReportEntity),
      useValue: createReportRepository(state),
    },
    {
      provide: getRepositoryToken(ExpenseItemEntity),
      useValue: createItemRepository(state),
    },
  ];
}
