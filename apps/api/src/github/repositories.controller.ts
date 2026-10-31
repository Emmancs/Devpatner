import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RepositoryFileContent, RepositoryFileEntry, RepositorySummary, UserProfile } from '@devpilot/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../auth/guards/project-access.guard';
import { AttachRepositoryDto } from './dto/attach-repository.dto';
import { RepositoryService } from './repository.service';

@ApiTags('Repositories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/repositories')
export class RepositoriesController {
  constructor(private readonly repositories: RepositoryService) {}

  @Post()
  @UseGuards(ProjectAccessGuard)
  @ApiOperation({ summary: 'Attach an accessible GitHub repository to a project' })
  attach(@CurrentUser() user: UserProfile, @Param('projectId') projectId: string, @Body() dto: AttachRepositoryDto): Promise<RepositorySummary> {
    return this.repositories.attach(user.id, projectId, dto.fullName);
  }

  @Post(':repositoryId/sync')
  @UseGuards(ProjectAccessGuard)
  @ApiOperation({ summary: 'Synchronize eligible source file metadata from GitHub' })
  sync(@CurrentUser() user: UserProfile, @Param('projectId') projectId: string, @Param('repositoryId') repositoryId: string) {
    return this.repositories.sync(user.id, projectId, repositoryId);
  }

  @Get(':repositoryId/files')
  @UseGuards(ProjectAccessGuard)
  @ApiOperation({ summary: 'List synchronized source files' })
  files(@CurrentUser() user: UserProfile, @Param('projectId') projectId: string, @Param('repositoryId') repositoryId: string): Promise<RepositoryFileEntry[]> {
    return this.repositories.files(user.id, projectId, repositoryId);
  }

  @Get(':repositoryId/file')
  @UseGuards(ProjectAccessGuard)
  @ApiOperation({ summary: 'Retrieve a bounded source file from GitHub' })
  file(@CurrentUser() user: UserProfile, @Param('projectId') projectId: string, @Param('repositoryId') repositoryId: string, @Query('path') path: string): Promise<RepositoryFileContent> {
    return this.repositories.file(user.id, projectId, repositoryId, path);
  }
}
