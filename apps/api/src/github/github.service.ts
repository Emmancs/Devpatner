import {
  Injectable,
  BadGatewayException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GithubCryptoService } from './crypto.service';
import { GitHubConnectionStatus, GitHubRepositoryOption } from '@devpilot/shared';

export interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
  html_url: string;
  clone_url?: string;
  private: boolean;
  size: number;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
}

interface GitHubContentResponse {
  type: string;
  path: string;
  size: number;
  encoding?: string;
  content?: string;
  download_url?: string | null;
}

const GITHUB_API = 'https://api.github.com';
const MAX_PAGE_SIZE = 100;

@Injectable()
export class GithubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cryptoService: GithubCryptoService
  ) {}

  getConnectionStatus(userId: string): Promise<GitHubConnectionStatus> {
    return this.prisma.connectedGitHubAccount.findFirst({
      where: { userId },
      select: { username: true, avatarUrl: true, scopes: true },
    }).then((account) => account
      ? { connected: true, username: account.username, avatarUrl: account.avatarUrl, scopes: account.scopes }
      : { connected: false });
  }

  createAuthorizationUrl(userId: string): string {
    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    const callback = this.config.get<string>('GITHUB_CALLBACK_URL');
    if (!clientId || !callback) {
      throw new ServiceUnavailableException('GitHub integration is not configured.');
    }
    const payload = Buffer.from(JSON.stringify({
      userId,
      nonce: crypto.randomBytes(16).toString('hex'),
      expiresAt: Date.now() + 10 * 60 * 1000,
    })).toString('base64url');
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new ServiceUnavailableException('Authentication security is not configured.');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const state = `${payload}.${signature}`;
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callback);
    url.searchParams.set('scope', 'read:user user:email repo read:org');
    url.searchParams.set('state', state);
    return url.toString();
  }

  async completeAuthorization(code: string, state: string): Promise<string> {
    const userId = this.verifyState(state);
    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.config.get<string>('GITHUB_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new ServiceUnavailableException('GitHub integration is not configured.');
    const tokenResponse = await this.request<{ access_token: string; scope?: string }>(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
      },
      false
    );
    if (!tokenResponse.access_token) throw new BadGatewayException('GitHub did not return an access token.');
    const user = await this.githubRequest<{ id: number; login: string; avatar_url: string; email: string | null }>(
      tokenResponse.access_token, '/user'
    );
    await this.prisma.connectedGitHubAccount.upsert({
      where: { userId_githubUserId: { userId, githubUserId: String(user.id) } },
      create: {
        userId,
        githubUserId: String(user.id),
        username: user.login,
        email: user.email,
        avatarUrl: user.avatar_url,
        accessTokenEncrypted: this.cryptoService.encrypt(tokenResponse.access_token),
        scopes: tokenResponse.scope || null,
      },
      update: {
        username: user.login,
        email: user.email,
        avatarUrl: user.avatar_url,
        accessTokenEncrypted: this.cryptoService.encrypt(tokenResponse.access_token),
        scopes: tokenResponse.scope || null,
      },
    });
    return this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async listRepositories(userId: string, page = 1, perPage = 30): Promise<{ items: GitHubRepositoryOption[]; hasNextPage: boolean }> {
    const token = await this.getToken(userId);
    const safePage = Math.max(1, Math.floor(page));
    const safePerPage = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(perPage)));
    const items = await this.githubRequest<GitHubRepositoryResponse[]>(
      token, `/user/repos?per_page=${safePerPage}&page=${safePage}&sort=updated&direction=desc&affiliation=owner,collaborator,organization_member`
    );
    return {
      items: items.map((repo) => this.toRepositoryOption(repo)),
      hasNextPage: items.length === safePerPage,
    };
  }

  async getRepository(userId: string, fullName: string): Promise<GitHubRepositoryResponse> {
    const token = await this.getToken(userId);
    return this.githubRequest<GitHubRepositoryResponse>(token, `/repos/${this.safeFullName(fullName)}`);
  }

  async getBranches(userId: string, fullName: string): Promise<string[]> {
    const token = await this.getToken(userId);
    const branches = await this.githubRequest<Array<{ name: string }>>(token, `/repos/${this.safeFullName(fullName)}/branches?per_page=100`);
    return branches.map((branch) => branch.name);
  }

  async getTree(userId: string, fullName: string, branch: string): Promise<Array<{ path: string; size: number; type: string }>> {
    const token = await this.getToken(userId);
    const repo = this.safeFullName(fullName);
    const branchData = await this.githubRequest<{ commit: { sha: string } }>(
      token, `/repos/${repo}/branches/${encodeURIComponent(branch)}`
    );
    const tree = await this.githubRequest<{ tree: Array<{ path: string; size?: number; type: string }>; truncated: boolean }>(
      token, `/repos/${repo}/git/trees/${branchData.commit.sha}?recursive=1`
    );
    if (tree.truncated) throw new HttpException('GitHub returned a truncated repository tree; narrow the repository before syncing.', HttpStatus.PAYLOAD_TOO_LARGE);
    return tree.tree.map((entry) => ({ path: entry.path, size: entry.size || 0, type: entry.type }));
  }

  async getContent(userId: string, fullName: string, path: string, ref: string): Promise<GitHubContentResponse> {
    const safePath = this.safePath(path);
    const token = await this.getToken(userId);
    const content = await this.githubRequest<GitHubContentResponse>(
      token, `/repos/${this.safeFullName(fullName)}/contents/${safePath}?ref=${encodeURIComponent(ref)}`
    );
    if (content.type !== 'file') throw new NotFoundException('The requested path is not a file.');
    const maxBytes = Number(this.config.get<string>('MAX_FILE_SIZE_KB') || 500) * 1024;
    if (content.size > maxBytes) throw new ForbiddenException('This file exceeds the configured size limit.');
    return content;
  }

  async getToken(userId: string): Promise<string> {
    const account = await this.prisma.connectedGitHubAccount.findFirst({ where: { userId } });
    if (!account) throw new ServiceUnavailableException('Connect a GitHub account before accessing repositories.');
    return this.cryptoService.decrypt(account.accessTokenEncrypted);
  }

  private verifyState(state: string): string {
    const [payload, signature] = state.split('.');
    const secret = this.config.get<string>('JWT_SECRET');
    if (!payload || !signature || !secret) throw new ForbiddenException('Invalid GitHub authorization state.');
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw new ForbiddenException('Invalid GitHub authorization state.');
    }
    let decoded: { userId: string; expiresAt: number };
    try {
      decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId: string; expiresAt: number };
    } catch {
      throw new ForbiddenException('Invalid GitHub authorization state.');
    }
    if (!decoded.userId || decoded.expiresAt < Date.now()) throw new ForbiddenException('GitHub authorization state expired.');
    return decoded.userId;
  }

  private async githubRequest<T>(token: string, path: string): Promise<T> {
    return this.request<T>(`${GITHUB_API}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
  }

  private async request<T>(url: string, init: RequestInit, isGitHubApi = true): Promise<T> {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(Number(this.config.get<string>('GITHUB_REQUEST_TIMEOUT_MS') || 15000)) });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (response.headers.get('x-ratelimit-remaining') === '0') throw new HttpException('GitHub API rate limit exceeded.', HttpStatus.TOO_MANY_REQUESTS);
        throw new ForbiddenException('GitHub denied access to this resource.');
      }
      if (response.status === 404) throw new NotFoundException('GitHub resource was not found.');
      if (response.status === 429) throw new HttpException('GitHub API rate limit exceeded.', HttpStatus.TOO_MANY_REQUESTS);
      throw new BadGatewayException(`${isGitHubApi ? 'GitHub' : 'OAuth'} request failed.`);
    }
    return response.json() as Promise<T>;
  }

  private safeFullName(fullName: string): string {
    if (!/^[^/]+\/[^/]+$/.test(fullName) || fullName.includes('..')) {
      throw new NotFoundException('Invalid repository identifier.');
    }
    return fullName.split('/').map(encodeURIComponent).join('/');
  }

  private safePath(path: string): string {
    if (!path || path.startsWith('/') || path.includes('\\') || path.split('/').some((part) => part === '..' || part === '.')) {
      throw new ForbiddenException('Invalid repository file path.');
    }
    return path.split('/').map(encodeURIComponent).join('/');
  }

  private toRepositoryOption(repo: GitHubRepositoryResponse): GitHubRepositoryOption {
    return {
      id: repo.id, name: repo.name, fullName: repo.full_name, owner: repo.owner.login,
      defaultBranch: repo.default_branch, htmlUrl: repo.html_url, cloneUrl: repo.clone_url,
      isPrivate: repo.private, sizeKb: repo.size, stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count, openIssuesCount: repo.open_issues_count, primaryLanguage: repo.language,
    };
  }
}
