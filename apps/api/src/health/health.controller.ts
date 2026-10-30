import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthStatus } from '@devpilot/shared';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'System health check and diagnostic inspection' })
  @SwaggerResponse({
    status: 200,
    description: 'System health diagnostics including database and integration status',
  })
  async getHealth(): Promise<HealthStatus> {
    return this.healthService.checkHealth();
  }
}

