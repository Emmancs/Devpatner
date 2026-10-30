import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    checkDatabaseHealth: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'GEMINI_API_KEY') return 'test-key';
      if (key === 'GITHUB_CLIENT_ID') return 'test-github-id';
      if (key === 'AI_PROVIDER') return 'gemini';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should report ok status when database is connected', async () => {
    mockPrismaService.checkDatabaseHealth.mockResolvedValue({
      status: 'connected',
      latencyMs: 5,
    });

    const result = await service.checkHealth();
    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('connected');
    expect(result.services.aiProvider.status).toBe('configured');
    expect(result.services.githubIntegration.status).toBe('configured');
  });

  it('should report degraded status when database is disconnected', async () => {
    mockPrismaService.checkDatabaseHealth.mockResolvedValue({
      status: 'disconnected',
    });

    const result = await service.checkHealth();
    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('disconnected');
  });
});

