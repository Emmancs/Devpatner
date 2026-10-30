import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../token.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing. Please sign in.');
    }

    let payload: JwtPayload;
    try {
      payload = this.tokenService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token. Please sign in again.');
    }

    // Verify session validity in database
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.revokedAt !== null || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired or was revoked. Please sign in again.');
    }

    if (session.userId !== payload.sub) {
      throw new UnauthorizedException('Token payload does not match active session.');
    }

    // Attach user profile (without password hash) and sessionId to request
    (request as any).user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatarUrl: session.user.avatarUrl,
      role: session.user.role,
      createdAt: session.user.createdAt.toISOString(),
    };
    (request as any).sessionId = session.id;

    return true;
  }

  private extractTokenFromRequest(request: Request): string | null {
    const cookieName = this.configService.get<string>('SESSION_COOKIE_NAME') || 'devpilot_session';

    // Check cookie first
    if (request.cookies && request.cookies[cookieName]) {
      return request.cookies[cookieName];
    }

    // Check Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    return null;
  }
}
