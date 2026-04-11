import { environmentSchema } from '@backend/config/environment.schema';

describe('environmentSchema', () => {
  const validEnvironment = {
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: 5432,
    POSTGRES_USER: 'gradion_user',
    POSTGRES_PASSWORD: 'secure_pass',
    POSTGRES_DB: 'expense_system',
    DATABASE_URL:
      'postgresql://gradion_user:secure_pass@localhost:5432/expense_system?schema=public',
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: 9000,
    MINIO_USE_SSL: false,
    MINIO_ROOT_USER: 'gradion_minio',
    MINIO_ROOT_PASSWORD: 'secure_minio_pass',
    MINIO_BUCKET_NAME: 'receipts',
    MINIO_PUBLIC_URL: 'http://localhost:9000',
    JWT_SECRET: 'replace-with-a-long-random-string',
    JWT_EXPIRES_IN: '1d',
    AI_PROVIDER_API_KEY: '',
  };

  it('applies bootstrap defaults', () => {
    const result = environmentSchema.validate(validEnvironment);

    expect(result.error).toBeUndefined();
    expect(result.value.NODE_ENV).toBe('development');
    expect(result.value.PORT).toBe(4000);
  });

  it('rejects weak jwt secrets', () => {
    const result = environmentSchema.validate({
      ...validEnvironment,
      JWT_SECRET: 'short-secret',
    });

    expect(result.error).toBeDefined();
  });
});
