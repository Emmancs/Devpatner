import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User authentication is required to access project resources.');
    }

    // Extract project ID from route params or body
    const projectId =
      request.params.projectId ||
      request.params.id ||
      request.body?.projectId;

    if (!projectId) {
      // If no project ID is in the context, pass through (or let route-level logic decide)
      return true;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, isArchived: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' was not found.`);
    }

    // Check project ownership
    if (project.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You do not have authorization to view or modify this project.');
    }

    return true;
  }
}

