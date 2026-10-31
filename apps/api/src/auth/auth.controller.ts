import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserProfile, AuthResponseData } from '@devpilot/shared';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @SwaggerResponse({ status: 201, description: 'User account successfully registered' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseData> {
    const meta = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.authService.register(dto, meta);
    this.setAuthCookie(res, result.accessToken, result.expiresAt);

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in to an existing account' })
  @SwaggerResponse({ status: 200, description: 'User successfully authenticated' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseData> {
    const meta = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.authService.login(dto, meta);
    this.setAuthCookie(res, result.accessToken, result.expiresAt);

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out and revoke active session' })
  @SwaggerResponse({ status: 200, description: 'User session successfully revoked' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ success: boolean }> {
    const sessionId = (req as any).sessionId;
    const result = await this.authService.logout(sessionId);
    this.clearAuthCookie(res);
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve currently authenticated user profile' })
  @SwaggerResponse({ status: 200, description: 'Current authenticated user profile' })
  async getProfile(@CurrentUser() user: UserProfile): Promise<UserProfile> {
    return user;
  }

  private setAuthCookie(res: Response, token: string, expiresAt: Date) {
    const cookieName = this.configService.get<string>('SESSION_COOKIE_NAME') || 'devpilot_session';
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      expires: expiresAt,
      path: '/',
    });
  }

  private clearAuthCookie(res: Response) {
    const cookieName = this.configService.get<string>('SESSION_COOKIE_NAME') || 'devpilot_session';
    res.clearCookie(cookieName, {
      httpOnly: true,
      path: '/',
    });
  }
}

