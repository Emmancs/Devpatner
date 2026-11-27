import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  CodeExplanationResponse,
  CodebaseChatResponse,
  ChatMessage,
  FindingItem,
  FindingStatus,
  FindingCategory,
  FindingSeverity,
  AnalysisSource,
  SuggestFixResponse,
  RepositoryAnalytics,
} from '@devpilot/shared';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { GeminiProvider } from './providers/gemini.provider';
import { CodeSearchService } from './code-search.service';
import { ExplainCodeDto } from './dto/explain-code.dto';
import { CodebaseChatDto } from './dto/codebase-chat.dto';
import { UpdateFindingStatusDto } from './dto/update-finding-status.dto';
import { TokenUsage } from './interfaces/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GithubService,
    private readonly gemini: GeminiProvider,
    private readonly searchService: CodeSearchService
  ) {}

  isConfigured(): boolean {
    return this.gemini.isConfigured();
  }

  private async recordUsage(
    userId: string,
    projectId: string | null,
    action: string,
    usage: TokenUsage
  ) {
    try {
      await this.prisma.usageRecord.create({
        data: {
          userId,
          projectId,
          action,
          modelName: 'gemini-2.0-flash',
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          costUsd: (usage.promptTokens * 0.0000001) + (usage.completionTokens * 0.0000004),
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to record token usage: ${(err as Error).message}`);
    }
  }

  private async assertProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) {
      throw new NotFoundException('Project was not found.');
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this project.');
    }
  }

  async analyzeFiles(
    userId: string,
    projectId: string,
    repositoryId: string,
    jobId: string,
    files: { path: string; content: string; fileId?: string }[]
  ): Promise<FindingItem[]> {
    if (!this.gemini.isConfigured()) {
      this.logger.log('Gemini provider is not configured. Skipping AI-assisted analysis.');
      return [];
    }

    const { findings: rawFindings, usage } = await this.gemini.generateStructuredFindings(files);
    await this.recordUsage(userId, projectId, 'ANALYSIS_JOB', usage);

    const createdFindings: FindingItem[] = [];

    for (const raw of rawFindings) {
      const matchedFile = files.find((f) => f.path === raw.filePath);
      const fingerprint = createHash('sha256')
        .update(`${raw.filePath}:${raw.startLine}:${raw.title}:${raw.category}`)
        .digest('hex');

      const findingRecord = await this.prisma.finding.create({
        data: {
          jobId,
          projectId,
          repositoryId,
          fileId: matchedFile?.fileId || null,
          filePath: raw.filePath,
          startLine: raw.startLine,
          endLine: raw.endLine,
          title: raw.title,
          description: raw.description,
          category: raw.category as any,
          severity: raw.severity as any,
          confidence: raw.confidence,
          status: 'OPEN',
          source: 'AI_GEMINI',
          evidence: raw.evidence,
          explanation: raw.explanation,
          recommendedFix: raw.recommendedFix,
          proposedPatch: raw.proposedPatch || null,
          fingerprint,
        },
      });

      createdFindings.push({
        id: findingRecord.id,
        jobId: findingRecord.jobId,
        projectId: findingRecord.projectId,
        repositoryId: findingRecord.repositoryId,
        filePath: findingRecord.filePath,
        startLine: findingRecord.startLine,
        endLine: findingRecord.endLine,
        title: findingRecord.title,
        description: findingRecord.description,
        category: findingRecord.category as FindingCategory,
        severity: findingRecord.severity as FindingSeverity,
        confidence: findingRecord.confidence,
        status: findingRecord.status as FindingStatus,
        source: findingRecord.source as AnalysisSource,
        evidence: findingRecord.evidence,
        explanation: findingRecord.explanation,
        recommendedFix: findingRecord.recommendedFix,
        proposedPatch: findingRecord.proposedPatch,
        fingerprint: findingRecord.fingerprint,
        createdAt: findingRecord.createdAt.toISOString(),
      });
    }

    return createdFindings;
  }

  async explainCode(
    userId: string,
    projectId: string,
    dto: ExplainCodeDto
  ): Promise<CodeExplanationResponse> {
    await this.assertProjectAccess(userId, projectId);

    if (!this.gemini.isConfigured()) {
      throw new ServiceUnavailableException(
        'Gemini API provider is not configured. Set GEMINI_API_KEY to enable AI code explanations.'
      );
    }

    const { explanation, usage } = await this.gemini.explainCode({
      filePath: dto.filePath,
      code: dto.code,
      startLine: dto.startLine,
      endLine: dto.endLine,
    });

    await this.recordUsage(userId, projectId, 'EXPLAIN_CODE', usage);
    return explanation;
  }

  async suggestFix(
    userId: string,
    findingId: string
  ): Promise<SuggestFixResponse> {
    const finding = await this.prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        project: { select: { ownerId: true } },
        repository: { select: { fullName: true, defaultBranch: true } },
      },
    });

    if (!finding) {
      throw new NotFoundException('Finding was not found.');
    }
    if (finding.project.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this finding.');
    }

    if (!this.gemini.isConfigured()) {
      throw new ServiceUnavailableException(
        'Gemini API provider is not configured. Set GEMINI_API_KEY to generate suggested patches.'
      );
    }

    const fileData = await this.github.getContent(
      userId,
      finding.repository.fullName,
      finding.filePath,
      finding.repository.defaultBranch
    );
    const text =
      fileData.encoding === 'base64'
        ? Buffer.from((fileData.content || '').replace(/\s/g, ''), 'base64').toString('utf8')
        : fileData.content || '';

    const lines = text.split(/\r?\n/);
    const start = Math.max(1, finding.startLine - 10);
    const end = Math.min(lines.length, finding.endLine + 10);
    const surroundingCode = lines.slice(start - 1, end).join('\n');

    const { fix, usage } = await this.gemini.suggestFix(
      {
        title: finding.title,
        description: finding.description,
        filePath: finding.filePath,
        startLine: finding.startLine,
        endLine: finding.endLine,
        evidence: finding.evidence,
      },
      surroundingCode
    );

    await this.prisma.finding.update({
      where: { id: findingId },
      data: {
        proposedPatch: fix.proposedPatch,
        recommendedFix: fix.explanation,
      },
    });

    await this.recordUsage(userId, finding.projectId, 'SUGGEST_FIX', usage);

    return {
      findingId: finding.id,
      filePath: finding.filePath,
      explanation: fix.explanation,
      proposedPatch: fix.proposedPatch,
      originalCodeSnippet: fix.originalCodeSnippet,
      fixedCodeSnippet: fix.fixedCodeSnippet,
      isValidPatch: fix.isValidPatch,
    };
  }

  async chatWithCodebase(
    userId: string,
    projectId: string,
    dto: CodebaseChatDto
  ): Promise<CodebaseChatResponse> {
    await this.assertProjectAccess(userId, projectId);

    if (!this.gemini.isConfigured()) {
      throw new ServiceUnavailableException(
        'Gemini API provider is not configured. Set GEMINI_API_KEY to enable repository chat.'
      );
    }

    let conversationId = dto.conversationId;
    let history: { role: 'user' | 'model'; content: string }[] = [];
    if (!conversationId) {
      const created = await this.prisma.conversation.create({
        data: {
          projectId,
          userId,
          title: dto.message.slice(0, 50),
        },
      });
      conversationId = created.id;
    } else {
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, projectId, userId },
        select: { id: true },
      });
      if (!conversation) {
        throw new NotFoundException('Conversation was not found in this project.');
      }

      const previousMessages = await this.prisma.conversationMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 6,
      });
      history = previousMessages.reverse().map((message) => ({
        role: message.role === 'USER' ? 'user' : 'model',
        content: message.content,
      }));
    }

    await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content: dto.message,
      },
    });

    const retrieved = await this.searchService.searchCodebase(userId, projectId, dto.message, 4);

    const { answer, references, usage } = await this.gemini.chatWithCodebase(
      dto.message,
      retrieved,
      history
    );

    await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: answer,
        retrievedContextJson: JSON.stringify(references),
        tokensUsed: usage.totalTokens,
      },
    });

    await this.recordUsage(userId, projectId, 'CODEBASE_CHAT', usage);

    return {
      conversationId,
      answer,
      references,
      tokensUsed: usage.totalTokens,
    };
  }

  async getConversationMessages(
    userId: string,
    projectId: string,
    conversationId: string
  ): Promise<ChatMessage[]> {
    await this.assertProjectAccess(userId, projectId);

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, projectId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return conversation.messages.map((m) => ({
      id: m.id,
      role: m.role as 'USER' | 'ASSISTANT' | 'SYSTEM',
      content: m.content,
      references: m.retrievedContextJson ? JSON.parse(m.retrievedContextJson) : undefined,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async updateFindingStatus(
    userId: string,
    findingId: string,
    dto: UpdateFindingStatusDto
  ): Promise<FindingItem> {
    const finding = await this.prisma.finding.findUnique({
      where: { id: findingId },
      include: { project: { select: { ownerId: true } } },
    });

    if (!finding) {
      throw new NotFoundException('Finding not found.');
    }
    if (finding.project.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this finding.');
    }

    const updated = await this.prisma.finding.update({
      where: { id: findingId },
      data: { status: dto.status as any },
    });

    return {
      id: updated.id,
      jobId: updated.jobId,
      projectId: updated.projectId,
      repositoryId: updated.repositoryId,
      filePath: updated.filePath,
      startLine: updated.startLine,
      endLine: updated.endLine,
      title: updated.title,
      description: updated.description,
      category: updated.category as FindingCategory,
      severity: updated.severity as FindingSeverity,
      confidence: updated.confidence,
      status: updated.status as FindingStatus,
      source: updated.source as AnalysisSource,
      evidence: updated.evidence,
      explanation: updated.explanation,
      recommendedFix: updated.recommendedFix,
      proposedPatch: updated.proposedPatch,
      fingerprint: updated.fingerprint,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async getProjectAnalytics(
    userId: string,
    projectId: string
  ): Promise<RepositoryAnalytics> {
    await this.assertProjectAccess(userId, projectId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        repositories: {
          include: {
            files: true,
          },
        },
        analysisJobs: {
          orderBy: { createdAt: 'asc' },
          include: { result: true },
        },
        findings: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const languageMap: Record<string, number> = {};
    let totalFiles = 0;
    let totalSizeBytes = 0;

    for (const repo of project.repositories) {
      for (const file of repo.files) {
        totalFiles++;
        totalSizeBytes += file.sizeBytes;
        const lang = file.language || 'Other';
        languageMap[lang] = (languageMap[lang] || 0) + 1;
      }
    }

    const severitySummary = { high: 0, medium: 0, low: 0, info: 0, total: 0 };
    const categoryMap: Record<string, number> = {};
    let staticCount = 0;
    let aiCount = 0;

    for (const f of project.findings) {
      severitySummary.total++;
      if (f.severity === 'HIGH') severitySummary.high++;
      else if (f.severity === 'MEDIUM') severitySummary.medium++;
      else if (f.severity === 'LOW') severitySummary.low++;
      else if (f.severity === 'INFO') severitySummary.info++;

      categoryMap[f.category] = (categoryMap[f.category] || 0) + 1;

      if (f.source === 'STATIC_ANALYZER' || f.source === 'STATIC_ESLINT') {
        staticCount++;
      } else {
        aiCount++;
      }
    }

    const analysisTrends = project.analysisJobs.map((j) => ({
      jobId: j.id,
      timestamp: j.queuedAt.toISOString(),
      findingsCount: j.result?.totalFindingsCount || 0,
      durationMs: j.result?.durationMs || 0,
      commitSha: j.commitSha.slice(0, 7),
    }));

    return {
      projectId: project.id,
      languageDistribution: languageMap,
      fileCount: totalFiles,
      totalSizeBytes,
      findingsBySeverity: severitySummary,
      findingsByCategory: categoryMap,
      analysisTrends,
      staticVsAi: {
        staticCount,
        aiCount,
      },
    };
  }
}
