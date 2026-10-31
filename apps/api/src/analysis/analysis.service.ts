import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AnalysisJobSummary,
  FindingItem,
  FindingStatus,
  JobStatus,
} from '@devpilot/shared';
import {
  Prisma,
  FindingCategory as PrismaFindingCategory,
  FindingSeverity as PrismaFindingSeverity,
  AnalysisSource as PrismaAnalysisSource,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { StaticAnalyzerService } from './static-analyzer.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GithubService,
    private readonly analyzer: StaticAnalyzerService,
    private readonly config: ConfigService
  ) {}

  async create(
    userId: string,
    projectId: string,
    repositoryId: string,
    dto: CreateAnalysisDto
  ): Promise<AnalysisJobSummary> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException('Project was not found.');
    if (project.ownerId !== userId) throw new ForbiddenException('You do not have access to this project.');

    const repository = await this.prisma.repository.findFirst({
      where: { id: repositoryId, projectId },
      include: { files: { where: { isIndexed: true }, orderBy: { path: 'asc' } } },
    });
    if (!repository) throw new NotFoundException('Repository was not found in this project.');
    if (repository.files.length === 0) {
      throw new ServiceUnavailableException('Synchronize eligible repository files before starting analysis.');
    }

    const branch = dto.branch || repository.defaultBranch;
    const job = await this.prisma.analysisJob.create({
      data: {
        projectId,
        repositoryId,
        commitSha: `branch:${branch}`,
        branch,
        status: JobStatus.QUEUED,
        currentStage: 'QUEUED',
      },
    });

    const startedAt = Date.now();
    try {
      await this.prisma.analysisJob.update({
        where: { id: job.id },
        data: { status: JobStatus.RUNNING, progressPercent: 5, currentStage: 'FETCHING_SOURCE' },
      });

      const maxFiles = Number(this.config.get<string>('MAX_FILES_PER_ANALYSIS') || 250);
      const files = repository.files.slice(0, maxFiles);
      const findings: Prisma.FindingCreateManyInput[] = [];

      for (const [index, file] of files.entries()) {
        const remote = await this.github.getContent(userId, repository.fullName, file.path, branch);
        const content = remote.encoding === 'base64'
          ? Buffer.from((remote.content || '').replace(/\s/g, ''), 'base64').toString('utf8')
          : remote.content || '';
        for (const finding of this.analyzer.analyze(file.path, content)) {
          findings.push({
            ...finding,
            category: finding.category as PrismaFindingCategory,
            severity: finding.severity as PrismaFindingSeverity,
            source: finding.source as PrismaAnalysisSource,
            fileId: file.id,
            projectId,
            repositoryId,
            jobId: job.id,
          });
        }
        if ((index + 1) % Math.max(1, Math.ceil(files.length / 10)) === 0) {
          await this.prisma.analysisJob.update({
            where: { id: job.id },
            data: {
              progressPercent: Math.min(95, Math.round(((index + 1) / files.length) * 90) + 5),
              currentStage: 'ANALYZING_SOURCE',
            },
          });
        }
      }

      const counts = findings.reduce(
        (result, finding) => {
          result.total += 1;
          if (finding.severity === 'HIGH') result.high += 1;
          if (finding.severity === 'MEDIUM') result.medium += 1;
          if (finding.severity === 'LOW') result.low += 1;
          if (finding.severity === 'INFO') result.info += 1;
          return result;
        },
        { total: 0, high: 0, medium: 0, low: 0, info: 0 }
      );

      await this.prisma.$transaction(async (transaction) => {
        if (findings.length > 0) {
          await transaction.finding.createMany({ data: findings });
        }
        await transaction.analysisResult.create({
          data: {
            jobId: job.id,
            projectId,
            staticFindingsCount: counts.total,
            totalFindingsCount: counts.total,
            highSeverityCount: counts.high,
            mediumSeverityCount: counts.medium,
            lowSeverityCount: counts.low,
            infoSeverityCount: counts.info,
            durationMs: Date.now() - startedAt,
            summary: `Static analysis completed across ${files.length} synchronized files.`,
            metricsJson: JSON.stringify({ filesAnalyzed: files.length, filesAvailable: repository.files.length }),
          },
        });
        await transaction.analysisJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.COMPLETED,
            progressPercent: 100,
            currentStage: 'COMPLETED',
            startedAt: new Date(startedAt),
            finishedAt: new Date(),
          },
        });
      });
    } catch (error) {
      await this.prisma.analysisJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          currentStage: 'FAILED',
          errorReason: error instanceof Error ? error.message.slice(0, 500) : 'Analysis failed.',
          finishedAt: new Date(),
        },
      });
      throw error;
    }

    return this.getJob(userId, projectId, job.id);
  }

  async listJobs(userId: string, projectId: string): Promise<AnalysisJobSummary[]> {
    await this.assertProject(userId, projectId);
    const jobs = await this.prisma.analysisJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { result: true },
    });
    return jobs.map((job) => this.toJobSummary(job));
  }

  async listFindings(userId: string, projectId: string, status?: FindingStatus): Promise<FindingItem[]> {
    await this.assertProject(userId, projectId);
    const findings = await this.prisma.finding.findMany({
      where: { projectId, ...(status ? { status } : {}) },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    });
    return findings.map((finding) => ({
      id: finding.id,
      jobId: finding.jobId,
      projectId: finding.projectId,
      repositoryId: finding.repositoryId,
      filePath: finding.filePath,
      startLine: finding.startLine,
      endLine: finding.endLine,
      startColumn: finding.startColumn,
      endColumn: finding.endColumn,
      title: finding.title,
      description: finding.description,
      category: finding.category as import('@devpilot/shared').FindingCategory,
      severity: finding.severity as import('@devpilot/shared').FindingSeverity,
      confidence: finding.confidence,
      status: finding.status as FindingStatus,
      source: finding.source as import('@devpilot/shared').AnalysisSource,
      evidence: finding.evidence,
      explanation: finding.explanation,
      recommendedFix: finding.recommendedFix,
      proposedPatch: finding.proposedPatch,
      fingerprint: finding.fingerprint,
      createdAt: finding.createdAt.toISOString(),
    }));
  }

  private async getJob(userId: string, projectId: string, jobId: string): Promise<AnalysisJobSummary> {
    await this.assertProject(userId, projectId);
    const job = await this.prisma.analysisJob.findFirst({
      where: { id: jobId, projectId },
      include: { result: true },
    });
    if (!job) throw new NotFoundException('Analysis job was not found.');
    return this.toJobSummary(job);
  }

  private async assertProject(userId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project) throw new NotFoundException('Project was not found.');
    if (project.ownerId !== userId) throw new ForbiddenException('You do not have access to this project.');
  }

  private toJobSummary(job: {
    id: string;
    projectId: string;
    repositoryId: string;
    commitSha: string;
    branch: string;
    status: string;
    progressPercent: number;
    currentStage: string | null;
    queuedAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    errorReason: string | null;
    result?: {
      totalFindingsCount: number;
      highSeverityCount: number;
      durationMs: number;
    } | null;
  }): AnalysisJobSummary {
    return {
      id: job.id,
      projectId: job.projectId,
      repositoryId: job.repositoryId,
      commitSha: job.commitSha,
      branch: job.branch,
      status: job.status as JobStatus,
      progressPercent: job.progressPercent,
      currentStage: job.currentStage,
      queuedAt: job.queuedAt.toISOString(),
      startedAt: job.startedAt?.toISOString() || null,
      finishedAt: job.finishedAt?.toISOString() || null,
      errorReason: job.errorReason,
      totalFindings: job.result?.totalFindingsCount || 0,
      highSeverity: job.result?.highSeverityCount || 0,
      durationMs: job.result?.durationMs || 0,
    };
  }
}
