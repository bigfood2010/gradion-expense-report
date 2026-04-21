import type { ConfigService } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';

import { registerPersistenceEntities, type PersistenceEntity } from './persistence-entities';

type EnvReader = (key: string) => string | undefined;

export interface PersistenceOptionsOverrides {
  type?: 'postgres' | 'sqljs';
  database?: string;
  entities?: readonly PersistenceEntity[];
  synchronize?: boolean;
  dropSchema?: boolean;
  logging?: boolean;
}

const DEFAULT_POSTGRES_PORT = 5432;
const DEFAULT_POOL_SIZE = 10;
const LOCAL_ENVIRONMENTS = new Set(['development', 'test']);

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function readNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function isLocalEnvironment(readEnv: EnvReader): boolean {
  const nodeEnv = (readEnv('NODE_ENV') ?? 'development').toLowerCase();
  return LOCAL_ENVIRONMENTS.has(nodeEnv);
}

function createPostgresOptions(
  readEnv: EnvReader,
  overrides: PersistenceOptionsOverrides,
  entities: readonly PersistenceEntity[],
): DataSourceOptions {
  const databaseUrl = readEnv('DATABASE_URL');
  const sslEnabled = readBoolean(readEnv('DB_SSL'), false);
  const sslCa = readEnv('DB_CA_CERT');
  const localEnvironment = isLocalEnvironment(readEnv);

  return {
    type: 'postgres',
    ...(databaseUrl
      ? { url: databaseUrl }
      : {
          host: readEnv('DB_HOST') ?? 'localhost',
          port: readNumber(readEnv('DB_PORT'), DEFAULT_POSTGRES_PORT),
          username: readEnv('DB_USERNAME') ?? '',
          password: readEnv('DB_PASSWORD') ?? '',
          database: overrides.database ?? readEnv('DB_NAME') ?? '',
        }),
    entities: [...entities],
    synchronize:
      overrides.synchronize ?? (localEnvironment && readBoolean(readEnv('DB_SYNCHRONIZE'), false)),
    dropSchema: overrides.dropSchema ?? false,
    logging: overrides.logging ?? readBoolean(readEnv('DB_LOGGING'), localEnvironment),
    ssl: sslEnabled
      ? {
          rejectUnauthorized: readBoolean(readEnv('DB_SSL_REJECT_UNAUTHORIZED'), true),
          ...(sslCa ? { ca: sslCa.replace(/\\n/g, '\n') } : {}),
        }
      : false,
    extra: {
      max: readNumber(readEnv('DB_POOL_SIZE'), DEFAULT_POOL_SIZE),
    },
  };
}

function createSqljsOptions(
  readEnv: EnvReader,
  overrides: PersistenceOptionsOverrides,
  entities: readonly PersistenceEntity[],
): DataSourceOptions {
  const location = readEnv('DB_SQLJS_LOCATION');

  return {
    type: 'sqljs',
    ...(location ? { location } : {}),
    autoSave: false,
    entities: [...entities],
    synchronize: overrides.synchronize ?? false,
    dropSchema: overrides.dropSchema ?? false,
    logging: overrides.logging ?? false,
  };
}

function buildPersistenceOptions(
  readEnv: EnvReader,
  overrides: PersistenceOptionsOverrides = {},
): DataSourceOptions {
  const entities = registerPersistenceEntities(...(overrides.entities ?? []));
  const selectedType =
    overrides.type ?? (readEnv('DB_TYPE') as 'postgres' | 'sqljs' | undefined) ?? 'postgres';

  if (selectedType === 'sqljs') {
    return createSqljsOptions(readEnv, overrides, entities);
  }

  return createPostgresOptions(readEnv, overrides, entities);
}

export function buildPersistenceDataSourceOptionsFromConfig(
  configService: Pick<ConfigService, 'get'>,
  overrides: PersistenceOptionsOverrides = {},
): DataSourceOptions {
  return buildPersistenceOptions((key) => configService.get<string>(key), overrides);
}

export function buildPersistenceDataSourceOptionsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  overrides: PersistenceOptionsOverrides = {},
): DataSourceOptions {
  return buildPersistenceOptions((key) => env[key], overrides);
}
