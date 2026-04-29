import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    HealthCheck,
    HealthCheckService,
    HttpHealthIndicator,
} from '@nestjs/terminus';
import { HEALTH_ENDPOINTS } from './health-endpoints';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private config: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const authBaseUrl = this.config.get('AUTH_SERVICE_URL', 'http://localhost:3001');
    const problemBaseUrl = this.config.get('PROBLEM_SERVICE_URL', 'http://localhost:8080');
    const executionBaseUrl = this.config.get('EXECUTION_SERVICE_URL', 'http://localhost:3002');
    const aiBaseUrl = this.config.get('AI_SERVICE_URL', 'http://localhost:3006');
    const searchBaseUrl = this.config.get('SEARCH_SERVICE_URL', 'http://localhost:3007');
    const emailBaseUrl = this.config.get('EMAIL_SERVICE_URL', 'http://localhost:3010');

    return this.health.check([
      () => this.http.pingCheck('auth-service', `${authBaseUrl}${HEALTH_ENDPOINTS.auth}`),
      () => this.http.pingCheck('problem-service', `${problemBaseUrl}${HEALTH_ENDPOINTS.problem}`),
      () => this.http.pingCheck('execution-service', `${executionBaseUrl}${HEALTH_ENDPOINTS.execution}`),
      () => this.http.pingCheck('ai-service', `${aiBaseUrl}${HEALTH_ENDPOINTS.ai}`),
      () => this.http.pingCheck('search-service', `${searchBaseUrl}${HEALTH_ENDPOINTS.search}`),
      () => this.http.pingCheck('email-service', `${emailBaseUrl}${HEALTH_ENDPOINTS.email}`),
    ]);
  }
}
