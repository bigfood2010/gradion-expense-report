import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import * as bcrypt from 'bcrypt';

import { AUTH_BCRYPT_SALT_ROUNDS } from '@backend/modules/auth/constants/auth.constants';
import { seedAccounts, seedItems, seedReports } from '@backend/context/seed/seed-data';
import { normalizeUserEmail } from '@backend/modules/users/domain/normalize-user-email';
import { ExpenseItemEntity } from '@backend/infrastructure/persistence/entities/expense-item.entity';
import { ExpenseReportEntity } from '@backend/infrastructure/persistence/entities/expense-report.entity';
import { UserEntity } from '@backend/infrastructure/persistence/entities/user.entity';
import { createPersistenceDataSource } from '@backend/infrastructure/persistence/typeorm/persistence-data-source';

const LOADED_ENV_KEYS = new Set<string>();
const DEMO_SEED_FLAG = 'ALLOW_DEMO_SEED';

function parseEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    if (!key) {
      continue;
    }

    const nextValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value =
      (nextValue.startsWith('"') && nextValue.endsWith('"')) ||
      (nextValue.startsWith("'") && nextValue.endsWith("'"))
        ? nextValue.slice(1, -1)
        : nextValue;

    if (process.env[key] !== undefined && !LOADED_ENV_KEYS.has(key)) {
      continue;
    }

    process.env[key] = value;
    LOADED_ENV_KEYS.add(key);
  }
}

function loadSeedEnvironment(): void {
  const repoRoot = path.resolve(__dirname, '../../../..');

  parseEnvFile(path.join(repoRoot, '.env'));
  parseEnvFile(path.join(repoRoot, 'backend', '.env'));
}

function assertDemoSeedAllowed(): void {
  if (process.env[DEMO_SEED_FLAG] !== 'true') {
    throw new Error(`${DEMO_SEED_FLAG}=true is required to run the demo seed.`);
  }
}

async function upsertSeedAccount(
  userRepository: {
    create(input: Partial<UserEntity>): UserEntity;
    findOne(options: { where: { email: string } }): Promise<UserEntity | null>;
    save(input: Partial<UserEntity>): Promise<UserEntity>;
  },
  account: (typeof seedAccounts)[number],
): Promise<'created' | 'updated'> {
  const email = normalizeUserEmail(account.email);
  const passwordHash = await bcrypt.hash(account.password, AUTH_BCRYPT_SALT_ROUNDS);
  const existingUser = await userRepository.findOne({
    where: { email },
  });

  if (existingUser) {
    existingUser.passwordHash = passwordHash;
    existingUser.role = account.role;
    await userRepository.save(existingUser);
    return 'updated';
  }

  const user = userRepository.create({
    email,
    passwordHash,
    role: account.role,
  });

  await userRepository.save(user);
  return 'created';
}

async function main(): Promise<void> {
  loadSeedEnvironment();
  assertDemoSeedAllowed();

  const dataSource = createPersistenceDataSource();

  try {
    await dataSource.initialize();
    await dataSource.runMigrations();

    const userRepository = dataSource.getRepository(UserEntity);
    const reportRepository = dataSource.getRepository(ExpenseReportEntity);
    const itemRepository = dataSource.getRepository(ExpenseItemEntity);

    // ── Users ──────────────────────────────────────────────────────────────
    const seededAccounts: string[] = [];

    for (const account of seedAccounts) {
      const action = await upsertSeedAccount(userRepository, account);
      seededAccounts.push(`${action}:${account.email}:${account.role}`);
    }

    console.log(`Seeded accounts: ${seededAccounts.join(', ')}`);

    // Build email → id lookup for report seeding
    const userIdByEmail = new Map<string, string>();
    for (const account of seedAccounts) {
      const email = normalizeUserEmail(account.email);
      const user = await userRepository.findOne({ where: { email } });
      if (user) userIdByEmail.set(email, user.id);
    }

    // ── Reports ────────────────────────────────────────────────────────────
    let reportsCreated = 0;
    let reportsSkipped = 0;

    for (const report of seedReports) {
      const existing = await reportRepository.findOne({ where: { id: report.id } });
      if (existing) {
        reportsSkipped++;
        continue;
      }

      const userId = userIdByEmail.get(normalizeUserEmail(report.userEmail));
      if (!userId) {
        throw new Error(`Seed user not found for email: ${report.userEmail}`);
      }

      const entity = reportRepository.create({
        id: report.id,
        userId,
        title: report.title,
        description: report.description,
        status: report.status,
        currency: report.currency,
        submittedAt: report.submittedAt ? new Date(report.submittedAt) : null,
        approvedAt: report.approvedAt ? new Date(report.approvedAt) : null,
        rejectedAt: report.rejectedAt ? new Date(report.rejectedAt) : null,
      });

      await reportRepository.save(entity);
      reportsCreated++;
    }

    console.log(`Seeded reports: ${reportsCreated} created, ${reportsSkipped} skipped`);

    // ── Items ──────────────────────────────────────────────────────────────
    let itemsCreated = 0;
    let itemsSkipped = 0;

    for (const item of seedItems) {
      const existing = await itemRepository.findOne({ where: { id: item.id } });
      if (existing) {
        itemsSkipped++;
        continue;
      }

      const entity = itemRepository.create({
        id: item.id,
        reportId: item.reportId,
        merchant: item.merchant,
        description: item.description,
        amount: item.amount,
        currency: item.currency,
        date: item.date,
        category: item.category,
        aiStatus: item.aiStatus,
        aiExtracted: item.aiExtracted,
        receiptUrl: null,
        receiptObjectKey: null,
        receiptOriginalName: null,
        receiptMimeType: null,
        receiptSize: null,
        extractionError: null,
      });

      await itemRepository.save(entity);
      itemsCreated++;
    }

    console.log(`Seeded items: ${itemsCreated} created, ${itemsSkipped} skipped`);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('ECONNREFUSED') || message.includes('connect ETIMEDOUT')) {
    console.error('Seed failed: cannot reach the database. Is Postgres running?');
  } else if (message.includes('duplicate key') || message.includes('already exists')) {
    console.error('Seed failed: a uniqueness constraint was violated during upsert.');
  } else if (message.includes('relation') && message.includes('does not exist')) {
    console.error(
      'Seed failed: a required table does not exist. Run migrations first or check DB_SYNCHRONIZE.',
    );
  } else {
    console.error('Seed failed:', message);
  }

  console.error(error);
  process.exitCode = 1;
});
