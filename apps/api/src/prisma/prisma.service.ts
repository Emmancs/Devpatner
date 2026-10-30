import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Prisma successfully connected to PostgreSQL database.');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(
        `Prisma could not connect to PostgreSQL at startup: ${(error as Error).message}. ` +
        `Ensure PostgreSQL is running and DATABASE_URL is configured.`
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }

  async checkDatabaseHealth(): Promise<{ status: 'connected' | 'disconnected'; latencyMs?: number }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      this.isConnected = true;
      return { status: 'connected', latencyMs: Date.now() - start };
    } catch {
      this.isConnected = false;
      return { status: 'disconnected' };
    }
  }
}

