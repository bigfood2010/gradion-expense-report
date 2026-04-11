import Joi from 'joi';

export const environmentSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(4000),
  CLIENT_ORIGIN: Joi.string().allow('').optional(),
  DATABASE_URL: Joi.string().uri().required(),
  MINIO_ENDPOINT: Joi.string().hostname().required(),
  MINIO_PORT: Joi.number().port().required(),
  MINIO_USE_SSL: Joi.boolean().required(),
  MINIO_ROOT_USER: Joi.string().min(1).required(),
  MINIO_ROOT_PASSWORD: Joi.string().min(1).required(),
  MINIO_BUCKET_NAME: Joi.string().min(1).required(),
  MINIO_PUBLIC_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(24).required(),
  JWT_EXPIRES_IN: Joi.string().min(1).required(),
  AI_PROVIDER_API_KEY: Joi.string().allow('').optional(),
}).unknown(true);
