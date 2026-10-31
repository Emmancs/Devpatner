import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    repository: {
      count: jest.fn(),
    },
    analysisJob: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    finding: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a project and return project summary', async () => {
      mockPrismaService.project.create.mockResolvedValue({
        id: 'proj-1',
        name: 'DevPilot Backend',
        description: 'Core API',
        defaultBranch: 'main',
        ownerId: 'user-1',
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('user-1', {
        name: 'DevPilot Backend',
        description: 'Core API',
      });

      expect(result.id).toBe('proj-1');
      expect(result.name).toBe('DevPilot Backend');
      expect(result.repositoriesCount).toBe(0);
      expect(result.findingsCount.total).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return projects for the user with calculated findings', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          name: 'DevPilot Backend',
          description: 'Core API',
          defaultBranch: 'main',
          ownerId: 'user-1',
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { repositories: 2 },
          findings: [{ severity: 'HIGH' }, { severity: 'MEDIUM' }, { severity: 'HIGH' }],
          analysisJobs: [{ status: 'COMPLETED', createdAt: new Date(), finishedAt: new Date() }],
        },
      ]);

      const results = await service.findAll('user-1');
      expect(results).toHaveLength(1);
      expect(results[0].repositoriesCount).toBe(2);
      expect(results[0].findingsCount.high).toBe(2);
      expect(results[0].findingsCount.medium).toBe(1);
      expect(results[0].findingsCount.total).toBe(3);
      expect(results[0].lastAnalysisStatus).toBe('COMPLETED');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if project does not exist', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);
      await expect(service.findOne('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if project does not belong to user', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'user-2', // Other user!
      });
      await expect(service.findOne('user-1', 'proj-1')).rejects.toThrow(ForbiddenException);
    });

    it('should return detailed project with repositories and recent analyses', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        name: 'DevPilot Backend',
        description: 'Core API',
        defaultBranch: 'main',
        ownerId: 'user-1',
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        repositories: [
          {
            id: 'repo-1',
            projectId: 'proj-1',
            name: 'api',
            fullName: 'devpilot/api',
            owner: 'devpilot',
            defaultBranch: 'main',
            htmlUrl: 'https://github.com/devpilot/api',
            cloneUrl: null,
            isPrivate: false,
            sizeKb: 1200,
            primaryLanguage: 'TypeScript',
            languagesJson: null,
            lastSyncedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        analysisJobs: [
          {
            id: 'job-1',
            projectId: 'proj-1',
            repositoryId: 'repo-1',
            commitSha: 'a1b2c3d',
            branch: 'main',
            status: 'COMPLETED',
            progressPercent: 100,
            currentStage: 'COMPLETED',
            queuedAt: new Date(),
            startedAt: new Date(),
            finishedAt: new Date(),
            errorReason: null,
            result: {
              totalFindingsCount: 5,
              highSeverityCount: 1,
              durationMs: 4200,
            },
          },
        ],
        findings: [{ severity: 'HIGH' }],
      });

      const result = await service.findOne('user-1', 'proj-1');
      expect(result.id).toBe('proj-1');
      expect(result.repositories).toHaveLength(1);
      expect(result.recentAnalyses).toHaveLength(1);
      expect(result.recentAnalyses[0].totalFindings).toBe(5);
    });
  });

  describe('getDashboardMetrics', () => {
    it('should return zeroes when user has no projects', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);

      const metrics = await service.getDashboardMetrics('user-1');
      expect(metrics.totalRepositories).toBe(0);
      expect(metrics.totalAnalyses).toBe(0);
      expect(metrics.findingsBySeverity.total).toBe(0);
      expect(metrics.recentProjects).toHaveLength(0);
    });

    it('should aggregate metrics accurately from database records', async () => {
      mockPrismaService.project.findMany
        .mockResolvedValueOnce([{ id: 'p1' }, { id: 'p2' }]) // for projectIds
        .mockResolvedValueOnce([]); // for findAll recentProjects
      mockPrismaService.repository.count.mockResolvedValue(4);
      mockPrismaService.analysisJob.count.mockResolvedValue(12);
      mockPrismaService.finding.groupBy.mockResolvedValue([
        { severity: 'HIGH', _count: 3 },
        { severity: 'MEDIUM', _count: 7 },
        { severity: 'LOW', _count: 2 },
      ]);
      mockPrismaService.analysisJob.findMany.mockResolvedValue([]);

      const metrics = await service.getDashboardMetrics('user-1');
      expect(metrics.totalRepositories).toBe(4);
      expect(metrics.totalAnalyses).toBe(12);
      expect(metrics.findingsBySeverity.high).toBe(3);
      expect(metrics.findingsBySeverity.medium).toBe(7);
      expect(metrics.findingsBySeverity.low).toBe(2);
      expect(metrics.findingsBySeverity.total).toBe(12);
    });
  });
});

