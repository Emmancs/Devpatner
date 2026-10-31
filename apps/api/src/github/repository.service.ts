import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import {
  RepositoryFileContent, RepositoryFileEntry, RepositorySummary,
} from '@devpilot/shared';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from './github.service';
import { GitHubRepositoryResponse } from './github.service';

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript React', js: 'JavaScript', jsx: 'JavaScript React',
  json: 'JSON', md: 'Markdown', css: 'CSS', scss: 'SCSS', html: 'HTML',
  py: 'Python', java: 'Java', go: 'Go', rs: 'Rust', cs: 'C#', sql: 'SQL',
  yaml: 'YAML', yml: 'YAML', xml: 'XML', sh: 'Shell',
};
const IGNORED = /(^|\/)(node_modules|\.git|dist|build|coverage|\.next)(\/|$)/;
const SOURCE = /\.(ts|tsx|js|jsx|json|md|css|scss|html|py|java|go|rs|cs|sql|ya?ml|xml|sh)$/i;

@Injectable()
export class RepositoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GithubService,
    private readonly config: ConfigService
  ) {}

  async attach(userId: string, projectId: string, fullName: string): Promise<RepositorySummary> {
    await this.assertProject(userId, projectId);
    const remote = await this.github.getRepository(userId, fullName);
    const repository = await this.prisma.repository.upsert({
      where: { projectId_fullName: { projectId, fullName: remote.full_name } },
      create: this.repositoryData(projectId, remote),
      update: this.repositoryData(projectId, remote),
    });
    return this.toSummary(repository);
  }

  async sync(userId: string, projectId: string, repositoryId: string) {
    const repository = await this.getRepository(userId, projectId, repositoryId);
    const tree = await this.github.getTree(userId, repository.fullName, repository.defaultBranch);
    const maxFiles = Number(this.config.get<string>('MAX_FILES_PER_ANALYSIS') || 250);
    const maxBytes = Number(this.config.get<string>('MAX_FILE_SIZE_KB') || 500) * 1024;
    const eligible = tree.filter((entry) => entry.type === 'blob' && SOURCE.test(entry.path) && !IGNORED.test(entry.path));
    const selected = eligible.slice(0, maxFiles);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.codeFile.deleteMany({ where: { repositoryId } });
      if (selected.length) {
        await transaction.codeFile.createMany({
          data: selected.map((entry) => {
            const filename = entry.path.split('/').pop() || entry.path;
            const extension = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : null;
            return {
              repositoryId, path: entry.path, filename, extension,
              language: extension ? LANGUAGE_BY_EXTENSION[extension] || extension.toUpperCase() : null,
              sizeBytes: entry.size, lineCount: 0, hash: createHash('sha256').update(`${repository.fullName}:${entry.path}:${entry.size}`).digest('hex'),
              isIndexed: entry.size <= maxBytes,
            };
          }),
        });
      }
      await transaction.repository.update({ where: { id: repositoryId }, data: { lastSyncedAt: new Date() } });
    });
    return { repositoryId, synchronizedFiles: selected.length, skippedFiles: eligible.length - selected.length, maxFiles, maxBytes };
  }

  async files(userId: string, projectId: string, repositoryId: string): Promise<RepositoryFileEntry[]> {
    await this.getRepository(userId, projectId, repositoryId);
    const files = await this.prisma.codeFile.findMany({ where: { repositoryId }, orderBy: { path: 'asc' } });
    return files.map((file) => ({
      path: file.path, filename: file.filename, extension: file.extension, language: file.language,
      sizeBytes: file.sizeBytes, lineCount: file.lineCount, isEligible: file.isIndexed,
    }));
  }

  async file(userId: string, projectId: string, repositoryId: string, path: string): Promise<RepositoryFileContent> {
    const repository = await this.getRepository(userId, projectId, repositoryId);
    const metadata = await this.prisma.codeFile.findUnique({ where: { repositoryId_path: { repositoryId, path } } });
    if (!metadata || !metadata.isIndexed) throw new NotFoundException('File is not synchronized or exceeds the file size limit.');
    const remote = await this.github.getContent(userId, repository.fullName, path, repository.defaultBranch);
    const content = remote.encoding === 'base64' ? Buffer.from((remote.content || '').replace(/\s/g, ''), 'base64').toString('utf8') : (remote.content || '');
    return { path, content, language: metadata.language, sizeBytes: metadata.sizeBytes, lineCount: content.split(/\r?\n/).length, truncated: false };
  }

  private async assertProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project) throw new NotFoundException('Project was not found.');
    if (project.ownerId !== userId) throw new ForbiddenException('You do not have access to this project.');
  }

  private async getRepository(userId: string, projectId: string, repositoryId: string) {
    await this.assertProject(userId, projectId);
    const repository = await this.prisma.repository.findFirst({ where: { id: repositoryId, projectId } });
    if (!repository) throw new NotFoundException('Repository was not found in this project.');
    return repository;
  }

  private repositoryData(projectId: string, remote: GitHubRepositoryResponse) {
    return {
      projectId, name: remote.name, fullName: remote.full_name, owner: remote.owner.login,
      defaultBranch: remote.default_branch, htmlUrl: remote.html_url, cloneUrl: remote.clone_url || null,
      isPrivate: remote.private, sizeKb: remote.size, stargazersCount: remote.stargazers_count,
      forksCount: remote.forks_count, openIssuesCount: remote.open_issues_count,
      primaryLanguage: remote.language, languagesJson: null,
    };
  }

  private toSummary(repository: {
    id: string; projectId: string; name: string; fullName: string; owner: string; defaultBranch: string;
    htmlUrl: string; cloneUrl: string | null; isPrivate: boolean; sizeKb: number; primaryLanguage: string | null;
    lastSyncedAt: Date | null; createdAt: Date; updatedAt: Date;
  }): RepositorySummary {
    return {
      id: repository.id, projectId: repository.projectId, name: repository.name, fullName: repository.fullName,
      owner: repository.owner, defaultBranch: repository.defaultBranch, htmlUrl: repository.htmlUrl,
      cloneUrl: repository.cloneUrl, isPrivate: repository.isPrivate, sizeKb: repository.sizeKb,
      primaryLanguage: repository.primaryLanguage, lastSyncedAt: repository.lastSyncedAt?.toISOString() || null,
      createdAt: repository.createdAt.toISOString(), updatedAt: repository.updatedAt.toISOString(),
    };
  }
}
