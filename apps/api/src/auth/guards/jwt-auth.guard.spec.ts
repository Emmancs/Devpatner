import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockTokenService: any;
  let mockConfigService: any;
  let mockPrismaService: any;

  beforeEach(() => {
    mockTokenService = {
      verify: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'SESSION_COOKIE_NAME') return 'devpilot_session';
        return null;
      }),
    };
    mockPrismaService = {
      authSession: {
        findUnique: jest.fn(),
      },
    };

    guard = new JwtAuthGuard(mockTokenService, mockConfigService, mockPrismaService);
  });

  const createMockContext = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
    const request: any = {
      headers,
      cookies,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  it('should throw UnauthorizedException when no token is provided', async () => {
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token verification throws', async () => {
    const context = createMockContext({ authorization: 'Bearer invalid.token.here' });
    mockTokenService.verify.mockImplementation(() => {
      throw new UnauthorizedException();
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when session is revoked', async () => {
    const context = createMockContext({ authorization: 'Bearer valid.jwt.token' });
    mockTokenService.verify.mockReturnValue({
      sub: 'user-1',
      sessionId: 'sess-1',
    });
    mockPrismaService.authSession.findUnique.mockResolvedValue({
      id: 'sess-1',
      userId: 'user-1',
      revokedAt: new Date(), // Revoked!
      expiresAt: new Date(Date.now() + 100000),
      user: { id: 'user-1', email: 'user@test.com', name: 'User' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when session is expired', async () => {
    const context = createMockContext({ authorization: 'Bearer valid.jwt.token' });
    mockTokenService.verify.mockReturnValue({
      sub: 'user-1',
      sessionId: 'sess-1',
    });
    mockPrismaService.authSession.findUnique.mockResolvedValue({
      id: 'sess-1',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 10000), // Expired!
      user: { id: 'user-1', email: 'user@test.com', name: 'User' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow access and attach user to request when token and session are valid', async () => {
    const context = createMockContext({ authorization: 'Bearer valid.jwt.token' });
    mockTokenService.verify.mockReturnValue({
      sub: 'user-1',
      sessionId: 'sess-1',
    });
    mockPrismaService.authSession.findUnique.mockResolvedValue({
      id: 'sess-1',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 1000000),
      user: {
        id: 'user-1',
        email: 'user@test.com',
        name: 'User One',
        avatarUrl: null,
        role: 'USER',
        createdAt: new Date(),
      },
    });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    const req = context.switchToHttp().getRequest<any>();
    expect(req.user.id).toBe('user-1');
    expect(req.sessionId).toBe('sess-1');
  });
});
