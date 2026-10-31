import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ProjectSummary,
  ProjectDetail,
  DashboardMetrics,
  JobStatus,
  FindingSeverity,
} from '@devpilot/shared';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectSummary> {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        defaultBranch: dto.defaultBranch || 'main',
        ownerId: userId,
      },
    });

    this.logger.log(`Project created: ${project.id} by user ${userId}`);

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      defaultBranch: project.defaultBranch,
      isArchived: project.isArchived,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      repositoriesCount: 0,
      findingsCount: { high: 0, medium: 0, low: 0, info: 0, total: 0 },
      lastAnalysisStatus: null,
      lastAnalysisAt: null,
    };
  }

  async findAll(userId: string): Promise<ProjectSummary[]> {
    const projects = await this.prisma.project.findMany({
      where: { ownerId: userId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { repositories: true },
        },
        findings: {
          select: { severity: true },
        },
        analysisJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, finishedAt: true, createdAt: true },
        },
      },
    });

    return projects.map((p) => {
      const severityMap = { high: 0, medium: 0, low: 0, info: 0 };
      for (const f of p.findings) {
        if (f.severity === 'HIGH') severityMap.high++;
        else if (f.severity === 'MEDIUM') severityMap.medium++;
        else if (f.severity === 'LOW') severityMap.low++;
        else if (f.severity === 'INFO') severityMap.info++;
      }

      const total = severityMap.high + severityMap.medium + severityMap.low + severityMap.info;
      const lastJob = p.analysisJobs[0];

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        ownerId: p.ownerId,
        defaultBranch: p.defaultBranch,
        isArchived: p.isArchived,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        repositoriesCount: p._count.repositories,
        findingsCount: {
          ...severityMap,
          total,
        },
        lastAnalysisStatus: (lastJob?.status as JobStatus) || null,
        lastAnalysisAt: lastJob ? (lastJob.finishedAt || lastJob.createdAt).toISOString() : null,
      };
    });
  }

  async findOne(userId: string, projectId: string): Promise<ProjectDetail> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        repositories: {
          orderBy: { createdAt: 'desc' },
        },
        analysisJobs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            result: true,
          },
        },
        findings: {
          select: { severity: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' was not found.`);
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this project.');
    }

    const severityMap = { high: 0, medium: 0, low: 0, info: 0 };
    for (const f of project.findings) {
      if (f.severity === 'HIGH') severityMap.high++;
      else if (f.severity === 'MEDIUM') severityMap.medium++;
      else if (f.severity === 'LOW') severityMap.low++;
      else if (f.severity === 'INFO') severityMap.info++;
    }

    const total = severityMap.high + severityMap.medium + severityMap.low + severityMap.info;
    const latestJob = project.analysisJobs[0];

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      defaultBranch: project.defaultBranch,
      isArchived: project.isArchived,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      repositoriesCount: project.repositories.length,
      findingsCount: {
        ...severityMap,
        total,
      },
      lastAnalysisStatus: (latestJob?.status as JobStatus) || null,
      lastAnalysisAt: latestJob ? (latestJob.finishedAt || latestJob.createdAt).toISOString() : null,
      repositories: project.repositories.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        name: r.name,
        fullName: r.fullName,
        owner: r.owner,
        defaultBranch: r.defaultBranch,
        htmlUrl: r.htmlUrl,
        cloneUrl: r.cloneUrl,
        isPrivate: r.isPrivate,
        sizeKb: r.sizeKb,
        primaryLanguage: r.primaryLanguage,
        languages: r.languagesJson ? JSON.parse(r.languagesJson) : undefined,
        lastSyncedAt: r.lastSyncedAt ? r.lastSyncedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      recentAnalyses: project.analysisJobs.map((j) => ({
        id: j.id,
        projectId: j.projectId,
        repositoryId: j.repositoryId,
        commitSha: j.commitSha,
        branch: j.branch,
        status: j.status as JobStatus,
        progressPercent: j.progressPercent,
        currentStage: j.currentStage,
        queuedAt: j.queuedAt.toISOString(),
        startedAt: j.startedAt ? j.startedAt.toISOString() : null,
        finishedAt: j.finishedAt ? j.finishedAt.toISOString() : null,
        errorReason: j.errorReason,
        totalFindings: j.result?.totalFindingsCount || 0,
        highSeverity: j.result?.highSeverityCount || 0,
        durationMs: j.result?.durationMs || 0,
      })),
    };
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto): Promise<ProjectSummary> {
    const existing = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!existing) {
      throw new NotFoundException(`Project with ID '${projectId}' was not found.`);
    }

    if (existing.ownerId !== userId) {
      throw new ForbiddenException('You do not have authorization to modify this project.');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name,
        description: dto.description,
        defaultBranch: dto.defaultBranch,
        isArchived: dto.isArchived,
      },
      include: {
        _count: { select: { repositories: true } },
        findings: { select: { severity: true } },
        analysisJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, finishedAt: true, createdAt: true },
        },
      },
    });

    const severityMap = { high: 0, medium: 0, low: 0, info: 0 };
    for (const f of updated.findings) {
      if (f.severity === 'HIGH') severityMap.high++;
      else if (f.severity === 'MEDIUM') severityMap.medium++;
      else if (f.severity === 'LOW') severityMap.low++;
      else if (f.severity === 'INFO') severityMap.info++;
    }

    const total = severityMap.high + severityMap.medium + severityMap.low + severityMap.info;
    const lastJob = updated.analysisJobs[0];

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      ownerId: updated.ownerId,
      defaultBranch: updated.defaultBranch,
      isArchived: updated.isArchived,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      repositoriesCount: updated._count.repositories,
      findingsCount: { ...severityMap, total },
      lastAnalysisStatus: (lastJob?.status as JobStatus) || null,
      lastAnalysisAt: lastJob ? (lastJob.finishedAt || lastJob.createdAt).toISOString() : null,
    };
  }

  async remove(userId: string, projectId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!existing) {
      throw new NotFoundException(`Project with ID '${projectId}' was not found.`);
    }

    if (existing.ownerId !== userId) {
      throw new ForbiddenException('You do not have authorization to delete this project.');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    this.logger.log(`Project deleted: ${projectId} by user ${userId}`);
    return { success: true };
  }

  async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    // 1. Get user project IDs
    const userProjects = await this.prisma.project.findMany({
      where: { ownerId: userId, isArchived: false },
      select: { id: true },
    });

    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return {
        totalRepositories: 0,
        totalAnalyses: 0,
        findingsBySeverity: { high: 0, medium: 0, low: 0, info: 0, total: 0 },
        recentProjects: [],
        recentAnalyses: [],
      };
    }

    // 2. Count connected repositories
    const totalRepositories = await this.prisma.repository.count({
      where: { projectId: { in: projectIds } },
    });

    // 3. Count total analyses
    const totalAnalyses = await this.prisma.analysisJob.count({
      where: { projectId: { in: projectIds } },
    });

    // 4. Group findings by severity
    const findings = await this.prisma.finding.groupBy({
      by: ['severity'],
      where: { projectId: { in: projectIds }, status: 'OPEN' },
      _count: true,
    });

    const findingsMap = { high: 0, medium: 0, low: 0, info: 0, total: 0 };
    for (const item of findings) {
      const count = item._count;
      if (item.severity === 'HIGH') findingsMap.high = count;
      else if (item.severity === 'MEDIUM') findingsMap.medium = count;
      else if (item.severity === 'LOW') findingsMap.low = count;
      else if (item.severity === 'INFO') findingsMap.info = count;
      findingsMap.total += count;
    }

    // 5. Recent projects (top 5)
    const recentProjects = await this.findAll(userId);

    // 6. Recent analyses (top 5)
    const recentJobs = await this.prisma.analysisJob.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { result: true },
    });

    const recentAnalyses = recentJobs.map((j) => ({
      id: j.id,
      projectId: j.projectId,
      repositoryId: j.repositoryId,
      commitSha: j.commitSha,
      branch: j.branch,
      status: j.status as JobStatus,
      progressPercent: j.progressPercent,
      currentStage: j.currentStage,
      queuedAt: j.queuedAt.toISOString(),
      startedAt: j.startedAt ? j.startedAt.toISOString() : null,
      finishedAt: j.finishedAt ? j.finishedAt.toISOString() : null,
      errorReason: j.errorReason,
      totalFindings: j.result?.totalFindingsCount || 0,
      highSeverity: j.result?.highSeverityCount || 0,
      durationMs: j.result?.durationMs || 0,
    }));

    return {
      totalRepositories,
      totalAnalyses,
      findingsBySeverity: findingsMap,
      recentProjects: recentProjects.slice(0, 5),
      recentAnalyses,
    };
  }
}

