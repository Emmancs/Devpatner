import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectAccessGuard } from './project-access.guard';

describe('ProjectAccessGuard', () => {
  let guard: ProjectAccessGuard;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      project: {
        findUnique: jest.fn(),
      },
    };
    guard = new ProjectAccessGuard(mockPrismaService);
  });

  const createMockContext = (user: any, params: Record<string, string> = {}) => {
    const request: any = {
      user,
      params,
      body: {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  it('should throw ForbiddenException if user is not attached to request', async () => {
    const context = createMockContext(null, { projectId: 'proj-1' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if project does not exist', async () => {
    const context = createMockContext({ id: 'user-1', role: 'USER' }, { projectId: 'nonexistent-proj' });
    mockPrismaService.project.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if project belongs to another user', async () => {
    const context = createMockContext({ id: 'user-1', role: 'USER' }, { projectId: 'proj-123' });
    mockPrismaService.project.findUnique.mockResolvedValue({
      id: 'proj-123',
      ownerId: 'user-2', // Different owner!
      isArchived: false,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access if user is the project owner', async () => {
    const context = createMockContext({ id: 'user-1', role: 'USER' }, { projectId: 'proj-123' });
    mockPrismaService.project.findUnique.mockResolvedValue({
      id: 'proj-123',
      ownerId: 'user-1',
      isArchived: false,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow access if user has ADMIN role even if not owner', async () => {
    const context = createMockContext({ id: 'admin-user', role: 'ADMIN' }, { projectId: 'proj-123' });
    mockPrismaService.project.findUnique.mockResolvedValue({
      id: 'proj-123',
      ownerId: 'user-1',
      isArchived: false,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
