import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let tokenService: TokenService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    authSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockTokenService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    tokenService = module.get<TokenService>(TokenService);
  });

  describe('register', () => {
    it('should register a new user successfully and return session info', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'dev@devpilot.ai',
        name: 'Alex Developer',
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date(),
      });
      mockPrismaService.authSession.create.mockResolvedValue({
        id: 'session-456',
        userId: 'user-123',
      });

      const result = await service.register({
        email: 'dev@devpilot.ai',
        password: 'Password123!',
        name: 'Alex Developer',
      });

      expect(result.user.email).toBe('dev@devpilot.ai');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.sessionId).toBeDefined();
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.register({
          email: 'dev@devpilot.ai',
          password: 'Password123!',
          name: 'Alex Developer',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const hashed = await bcrypt.hash('Password123!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'dev@devpilot.ai',
        passwordHash: hashed,
        name: 'Alex Developer',
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date(),
      });
      mockPrismaService.authSession.create.mockResolvedValue({
        id: 'session-456',
        userId: 'user-123',
      });

      const result = await service.login({
        email: 'dev@devpilot.ai',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('dev@devpilot.ai');
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should reject login if password does not match', async () => {
      const hashed = await bcrypt.hash('OtherPassword123!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'dev@devpilot.ai',
        passwordHash: hashed,
      });

      await expect(
        service.login({
          email: 'dev@devpilot.ai',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@devpilot.ai',
          password: 'Password123!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the active session', async () => {
      mockPrismaService.authSession.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('session-456');
      expect(result.success).toBe(true);
      expect(mockPrismaService.authSession.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-456', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('getProfile', () => {
    it('should return safe user profile without password hash', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'dev@devpilot.ai',
        name: 'Alex Developer',
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date(),
      });

      const profile = await service.getProfile('user-123');
      expect(profile.id).toBe('user-123');
      expect((profile as any).passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-999')).rejects.toThrow(NotFoundException);
    });
  });
});
