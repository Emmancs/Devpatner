import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GithubService } from './github.service';

describe('GithubService', () => {
  const prisma = {
    connectedGitHubAccount: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const config = {
    get: jest.fn((key: string) => ({
      GITHUB_CLIENT_ID: 'client-id',
      GITHUB_CALLBACK_URL: 'http://localhost:3001/api/v1/github/oauth/callback',
      JWT_SECRET: 'test-secret',
    } as Record<string, string>)[key]),
  };
  const cryptoService = { encrypt: jest.fn((value: string) => `encrypted:${value}`), decrypt: jest.fn(() => 'token') };

  beforeEach(() => jest.clearAllMocks());

  it('creates a signed OAuth URL', () => {
    const service = new GithubService(prisma as never, config as never, cryptoService as never);
    const url = new URL(service.createAuthorizationUrl('user-1'));
    expect(url.hostname).toBe('github.com');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('state')).toContain('.');
  });

  it('rejects repository access when no account is connected', async () => {
    prisma.connectedGitHubAccount.findFirst.mockResolvedValue(null);
    const service = new GithubService(prisma as never, config as never, cryptoService as never);
    await expect(service.listRepositories('user-1')).rejects.toThrow(ServiceUnavailableException);
  });

  it('rejects tampered OAuth state', async () => {
    const service = new GithubService(prisma as never, config as never, cryptoService as never);
    await expect(service.completeAuthorization('code', 'tampered.state')).rejects.toThrow(ForbiddenException);
  });
});
