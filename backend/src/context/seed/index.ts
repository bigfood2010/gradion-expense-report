import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import * as bcrypt from 'bcrypt';

import { AUTH_BCRYPT_SALT_ROUNDS } from '@backend/modules/auth/constants/auth.constants';
import { seedAccounts } from '@backend/context/seed/seed-data';
import { normalizeUserEmail } from '@backend/modules/users/domain/normalize-user-email';
import { UserEntity } from '@backend/infrastructure/persistence/entities/user.entity';
import { createPersistenceDataSource } from '@backend/infrastructure/persistence/typeorm/persistence-data-source';

const LOADED_ENV_KEYS = new Set<string>();

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

  const dataSource = createPersistenceDataSource();

  try {
    await dataSource.initialize();
    await dataSource.runMigrations();

    const userRepository = dataSource.getRepository(UserEntity);
    const seededAccounts: string[] = [];

    for (const account of seedAccounts) {
      const action = await upsertSeedAccount(userRepository, account);
      seededAccounts.push(`${action}:${account.email}:${account.role}`);
    }

    console.log(`Seeded accounts: ${seededAccounts.join(', ')}`);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void main().catch((error: unknown) => {
  console.error('Seed failed');
  console.error(error);
  process.exitCode = 1;
});
