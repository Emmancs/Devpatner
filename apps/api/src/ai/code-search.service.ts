import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';

export interface RetrievedSnippet {
  filePath: string;
  snippet: string;
  lineRange?: string;
  relevanceScore: number;
}

@Injectable()
export class CodeSearchService {
  private readonly logger = new Logger(CodeSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GithubService
  ) {}

  async searchCodebase(
    userId: string,
    projectId: string,
    query: string,
    limit = 5
  ): Promise<RetrievedSnippet[]> {
    const terms = query
      .toLowerCase()
      .replace(/[^\w\s/.-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (terms.length === 0) {
      return [];
    }

    // Retrieve repositories for project
    const repositories = await this.prisma.repository.findMany({
      where: { projectId },
      include: {
        files: {
          where: { isIndexed: true },
          take: 200,
        },
      },
    });

    const candidates: {
      repoFullName: string;
      ref: string;
      path: string;
      score: number;
      preview?: string | null;
    }[] = [];

    for (const repo of repositories) {
      for (const file of repo.files) {
        let score = 0;
        const lowerPath = file.path.toLowerCase();
        const lowerFilename = file.filename.toLowerCase();
        const lowerPreview = (file.contentPreview || '').toLowerCase();

        for (const term of terms) {
          if (lowerFilename.includes(term)) {
            score += 15;
          } else if (lowerPath.includes(term)) {
            score += 8;
          }
          if (lowerPreview.includes(term)) {
            score += 4;
          }
        }

        if (score > 0) {
          candidates.push({
            repoFullName: repo.fullName,
            ref: repo.defaultBranch,
            path: file.path,
            score,
            preview: file.contentPreview,
          });
        }
      }
    }

    // Sort by score descending and take top N
    candidates.sort((a, b) => b.score - a.score);
    const topCandidates = candidates.slice(0, limit);

    const snippets: RetrievedSnippet[] = [];

    for (const item of topCandidates) {
      try {
        const fileContent = await this.github.getContent(
          userId,
          item.repoFullName,
          item.path,
          item.ref
        );
        const text =
          fileContent.encoding === 'base64'
            ? Buffer.from((fileContent.content || '').replace(/\s/g, ''), 'base64').toString('utf8')
            : fileContent.content || '';

        // Extract most relevant 40-line chunk or top of file
        const lines = text.split(/\r?\n/);
        let startLine = 1;
        let bestMatchIndex = 0;

        for (let i = 0; i < lines.length; i++) {
          const l = lines[i].toLowerCase();
          if (terms.some((t) => l.includes(t))) {
            bestMatchIndex = i;
            break;
          }
        }

        startLine = Math.max(1, bestMatchIndex - 5);
        const endLine = Math.min(lines.length, startLine + 35);
        const snippetText = lines.slice(startLine - 1, endLine).join('\n');

        snippets.push({
          filePath: item.path,
          lineRange: `L${startLine}-L${endLine}`,
          snippet: snippetText.slice(0, 3000),
          relevanceScore: item.score,
        });
      } catch (error) {
        this.logger.warn(
          `Unable to retrieve ${item.repoFullName}/${item.path} for repository search: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        if (item.preview) {
          snippets.push({
            filePath: item.path,
            lineRange: 'L1-L20',
            snippet: item.preview,
            relevanceScore: item.score,
          });
        }
      }
    }

    return snippets;
  }
}
