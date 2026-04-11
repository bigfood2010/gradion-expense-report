import { Injectable } from '@nestjs/common';
import type { HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class ApplicationHealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    return {
      [key]: {
        status: 'up',
      },
    };
  }
}
