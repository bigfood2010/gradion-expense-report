import 'reflect-metadata';
import path from 'node:path';

import { DataSource, type DataSourceOptions } from 'typeorm';

import { buildPersistenceDataSourceOptionsFromEnv } from './persistence-typeorm-options';

const MIGRATIONS_DIR = path.join(__dirname, '../migrations/*.{ts,js}');

export function createPersistenceDataSource(
  overrides: Partial<DataSourceOptions> = {},
): DataSource {
  const baseOptions = buildPersistenceDataSourceOptionsFromEnv(process.env);
  const entities = (overrides.entities ??
    baseOptions.entities ??
    []) as DataSourceOptions['entities'];
  const dataSourceOptions = {
    ...baseOptions,
    ...overrides,
    entities,
    migrations: [MIGRATIONS_DIR],
    migrationsTableName: 'typeorm_migrations',
  } as DataSourceOptions;

  return new DataSource(dataSourceOptions);
}

export default createPersistenceDataSource();
