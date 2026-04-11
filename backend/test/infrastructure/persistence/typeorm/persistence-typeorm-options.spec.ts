import type { DataSourceOptions } from 'typeorm';

import {
  ExpenseItemEntity,
  ExpenseReportEntity,
  UserEntity,
  buildPersistenceDataSourceOptionsFromEnv,
  registerPersistenceEntities,
} from '@backend/infrastructure/persistence';

class ExtraEntity {}

describe('persistence typeorm options', () => {
  it('uses safe local defaults for postgres', () => {
    const options = buildPersistenceDataSourceOptionsFromEnv({
      NODE_ENV: 'development',
      DB_HOST: 'localhost',
      DB_USERNAME: 'gradion_user',
      DB_PASSWORD: 'secure_pass',
      DB_NAME: 'expense_system',
    }) as Extract<DataSourceOptions, { type: 'postgres' }>;

    expect(options.type).toBe('postgres');
    expect(options.host).toBe('localhost');
    expect(options.port).toBe(5432);
    expect(options.username).toBe('gradion_user');
    expect(options.password).toBe('secure_pass');
    expect(options.database).toBe('expense_system');
    expect(options.synchronize).toBe(false);
    expect(options.logging).toBe(true);
    expect(options.ssl).toBe(false);
  });

  it('disables sync and logging by default in production', () => {
    const options = buildPersistenceDataSourceOptionsFromEnv({
      NODE_ENV: 'production',
    }) as Extract<DataSourceOptions, { type: 'postgres' }>;

    expect(options.synchronize).toBe(false);
    expect(options.logging).toBe(false);
  });

  it('builds sql.js options when requested', () => {
    const options = buildPersistenceDataSourceOptionsFromEnv({
      DB_TYPE: 'sqljs',
      DB_SQLJS_LOCATION: ':memory:',
    }) as Extract<DataSourceOptions, { type: 'sqljs' }>;

    expect(options.type).toBe('sqljs');
    expect(options.synchronize).toBe(false);
  });

  it('registers the persistence entities without duplicates', () => {
    const entities = registerPersistenceEntities(
      ExtraEntity,
      UserEntity,
      ExpenseReportEntity,
      ExpenseItemEntity,
    );

    expect(entities).toEqual(
      expect.arrayContaining([UserEntity, ExpenseReportEntity, ExpenseItemEntity, ExtraEntity]),
    );
    expect(new Set(entities).size).toBe(4);
  });
});
