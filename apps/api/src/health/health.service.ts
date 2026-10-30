import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HealthStatus } from '@devpilot/shared';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async checkHealth(): Promise<HealthStatus> {
    const dbHealth = await this.prisma.checkDatabaseHealth();
    
    const geminiKey = this.config.get<string>('GEMINI_API_KEY');
    const githubId = this.config.get<string>('GITHUB_CLIENT_ID');
    const aiProvider = this.config.get<string>('AI_PROVIDER') || 'gemini';

    const memoryUsage = process.memoryUsage();

    const isHealthy = dbHealth.status === 'connected';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      version: '0.1.0',
      services: {
        database: {
          status: dbHealth.status,
          latencyMs: dbHealth.latencyMs,
        },
        aiProvider: {
          provider: aiProvider,
          status: geminiKey && geminiKey.trim().length > 0 ? 'configured' : 'unconfigured',
        },
        githubIntegration: {
          status: githubId && githubId.trim().length > 0 ? 'configured' : 'unconfigured',
        },
      },
      memory: {
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      },
    };
  }
}

