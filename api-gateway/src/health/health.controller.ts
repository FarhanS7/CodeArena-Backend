import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    HealthCheck,
    HealthCheckService,
    HttpHealthIndicator,
    TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private config: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('auth-service', this.config.get('AUTH_SERVICE_URL', 'http://localhost:3001')),
      () => this.http.pingCheck('problem-service', this.config.get('PROBLEM_SERVICE_URL', 'http://localhost:8080') + '/actuator/health'),
      () => this.http.pingCheck('execution-service', this.config.get('EXECUTION_SERVICE_URL', 'http://localhost:3002')),
      () => this.http.pingCheck('ai-service', this.config.get('AI_SERVICE_URL', 'http://localhost:3006') + '/ai/hint'), // simple ping
    ]);
  }
}
