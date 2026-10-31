import {
  Controller, Get, Post, Query, Param, Body, Res, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UserProfile } from '@devpilot/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GithubService } from './github.service';

@ApiTags('GitHub')
@Controller('github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  @Get('oauth/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a GitHub OAuth authorization URL' })
  start(@CurrentUser() user: UserProfile): { authorizationUrl: string } {
    return { authorizationUrl: this.github.createAuthorizationUrl(user.id) };
  }

  @Get('oauth/callback')
  @ApiOperation({ summary: 'Complete GitHub OAuth authorization' })
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() response: Response): Promise<void> {
    if (!code || !state) {
      response.status(400).send('GitHub authorization requires code and state.');
      return;
    }
    const frontendUrl = await this.github.completeAuthorization(code, state);
    response.redirect(`${frontendUrl}/settings/integrations?connected=1`);
  }

  @Get('connection')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getConnection(@CurrentUser() user: UserProfile) {
    return this.github.getConnectionStatus(user.id);
  }

  @Get('repositories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listRepositories(@CurrentUser() user: UserProfile, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.github.listRepositories(user.id, Number(page || 1), Number(perPage || 30));
  }

  @Get('repositories/:owner/:name/branches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getBranches(@CurrentUser() user: UserProfile, @Param('owner') owner: string, @Param('name') name: string) {
    return this.github.getBranches(user.id, `${owner}/${name}`);
  }
}
