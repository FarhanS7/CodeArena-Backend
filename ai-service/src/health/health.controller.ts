import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('ai/health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Basic check for AI service
      () => ({ 'ai-api': { status: 'up' } }),
    ]);
  }
}
