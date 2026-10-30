import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserProfile, UserRole } from '@devpilot/shared';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const BCRYPT_SALT_ROUNDS = 12;

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthSessionResult {
  user: UserProfile;
  accessToken: string;
  sessionId: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService
  ) {}

  async register(
    dto: RegisterDto,
    meta: RequestMetadata = {}
  ): Promise<AuthSessionResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: 'USER',
      },
    });

    this.logger.log(`New user registered: ${user.id} (${user.email})`);
    return this.createSessionForUser(user, meta);
  }

  async login(
    dto: LoginDto,
    meta: RequestMetadata = {}
  ): Promise<AuthSessionResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    this.logger.log(`User logged in: ${user.id}`);
    return this.createSessionForUser(user, meta);
  }

  async logout(sessionId: string): Promise<{ success: boolean }> {
    if (!sessionId) {
      return { success: true };
    }

    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Session revoked: ${sessionId}`);
    return { success: true };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role as UserRole,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async createSessionForUser(
    user: { id: string; email: string; name: string; avatarUrl: string | null; role: string; createdAt: Date },
    meta: RequestMetadata
  ): Promise<AuthSessionResult> {
    const expiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const sessionRawId = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(sessionRawId).digest('hex');

    const session = await this.prisma.authSession.create({
      data: {
        id: sessionRawId,
        userId: user.id,
        tokenHash,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      sessionId: session.id,
    };

    const accessToken = this.tokenService.sign(payload, `${expiresInDays}d`);

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role as UserRole,
      createdAt: user.createdAt.toISOString(),
    };

    return {
      user: profile,
      accessToken,
      sessionId: session.id,
      expiresAt,
    };
  }
}
