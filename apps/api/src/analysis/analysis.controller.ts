import { Controller, Get, Param, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindingStatus, UserProfile } from '@devpilot/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../auth/guards/project-access.guard';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';

@ApiTags('Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId')
export class AnalysisController {
  constructor(private readonly analysis: AnalysisService) {}

  @Post('repositories/:repositoryId/analysis')
  @UseGuards(ProjectAccessGuard)
  @ApiOperation({ summary: 'Run deterministic static analysis for a synchronized repository' })
  create(
    @CurrentUser() user: UserProfile,
    @Param('projectId') projectId: string,
    @Param('repositoryId') repositoryId: string,
    @Body() dto: CreateAnalysisDto
  ) {
    return this.analysis.create(user.id, projectId, repositoryId, dto);
  }

  @Get('analysis')
  @UseGuards(ProjectAccessGuard)
  @ApiOperation({ summary: 'List project analysis history' })
  listJobs(@CurrentUser() user: UserProfile, @Param('projectId') projectId: string) {
    return this.analysis.listJobs(user.id, projectId);
  }

  @Get('findings')
  @UseGuards(ProjectAccessGuard)
  @ApiOperation({ summary: 'List project findings' })
  listFindings(
    @CurrentUser() user: UserProfile,
    @Param('projectId') projectId: string,
    @Query('status') status?: FindingStatus
  ) {
    return this.analysis.listFindings(user.id, projectId, status);
  }
}
