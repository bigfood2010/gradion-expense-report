import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ApplicationHealthIndicator } from './app-health.indicator';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [ApplicationHealthIndicator],
})
export class HealthModule {}
