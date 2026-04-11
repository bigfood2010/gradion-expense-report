import { Controller, Get } from '@nestjs/common';
import { HealthCheck, type HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { Public } from '@backend/modules/auth/decorators/public.decorator';
import { ApplicationHealthIndicator } from './app-health.indicator';

@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly applicationHealthIndicator: ApplicationHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.applicationHealthIndicator.isHealthy('application'),
    ]);
  }
}
