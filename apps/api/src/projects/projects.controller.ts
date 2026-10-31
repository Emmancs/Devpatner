import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../auth/guards/project-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  UserProfile,
  ProjectSummary,
  ProjectDetail,
  DashboardMetrics,
} from '@devpilot/shared';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project workspace' })
  @SwaggerResponse({ status: 201, description: 'Project successfully created' })
  async create(
    @CurrentUser() user: UserProfile,
    @Body() dto: CreateProjectDto
  ): Promise<ProjectSummary> {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active projects for authenticated user' })
  @SwaggerResponse({ status: 200, description: 'List of project summaries' })
  async findAll(@CurrentUser() user: UserProfile): Promise<ProjectSummary[]> {
    return this.projectsService.findAll(user.id);
  }

  @Get('dashboard/metrics')
  @ApiOperation({ summary: 'Aggregate metrics for authenticated user dashboard' })
  @SwaggerResponse({ status: 200, description: 'Dashboard metrics and overview data' })
  async getMetrics(@CurrentUser() user: UserProfile): Promise<DashboardMetrics> {
    return this.projectsService.getDashboardMetrics(user.id);
  }

  @Get(':projectId')
  @UseGuards(ProjectAccessGuard)
  @ApiParam({ name: 'projectId', description: 'Unique project identifier' })
  @ApiOperation({ summary: 'Retrieve full project details with repositories and analyses' })
  @SwaggerResponse({ status: 200, description: 'Detailed project view' })
  async findOne(
    @CurrentUser() user: UserProfile,
    @Param('projectId') projectId: string
  ): Promise<ProjectDetail> {
    return this.projectsService.findOne(user.id, projectId);
  }

  @Patch(':projectId')
  @UseGuards(ProjectAccessGuard)
  @ApiParam({ name: 'projectId', description: 'Unique project identifier' })
  @ApiOperation({ summary: 'Update project settings or status' })
  @SwaggerResponse({ status: 200, description: 'Updated project summary' })
  async update(
    @CurrentUser() user: UserProfile,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto
  ): Promise<ProjectSummary> {
    return this.projectsService.update(user.id, projectId, dto);
  }

  @Delete(':projectId')
  @UseGuards(ProjectAccessGuard)
  @ApiParam({ name: 'projectId', description: 'Unique project identifier' })
  @ApiOperation({ summary: 'Delete a project workspace' })
  @SwaggerResponse({ status: 200, description: 'Project deletion confirmation' })
  async remove(
    @CurrentUser() user: UserProfile,
    @Param('projectId') projectId: string
  ): Promise<{ success: boolean }> {
    return this.projectsService.remove(user.id, projectId);
  }
}

