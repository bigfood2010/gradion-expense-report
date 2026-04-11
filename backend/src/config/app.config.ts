import { registerAs } from '@nestjs/config';

export interface AppConfig {
  apiPrefix: string;
  apiVersion: string;
  corsOrigin: string[];
  port: number;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    port: Number(process.env.PORT ?? 4000),
    apiPrefix: 'api',
    apiVersion: '1',
    corsOrigin: toCorsOrigin(process.env.CLIENT_ORIGIN),
  }),
);

function toCorsOrigin(rawValue: string | undefined): string[] {
  if (!rawValue) {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? [] : ['http://localhost:3000', 'http://localhost:5173'];
  }

  return rawValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
