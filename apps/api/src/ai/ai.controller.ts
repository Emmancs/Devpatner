import {
  Controller,
  Post,
  Get,
  Patch,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../auth/guards/project-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  UserProfile,
  CodeExplanationResponse,
  CodebaseChatResponse,
  ChatMessage,
  SuggestFixResponse,
  FindingItem,
  RepositoryAnalytics,
} from '@devpilot/shared';
import { AiService } from './ai.service';
import { ExplainCodeDto } from './dto/explain-code.dto';
import { CodebaseChatDto } from './dto/codebase-chat.dto';
import { UpdateFindingStatusDto } from './dto/update-finding-status.dto';

@ApiTags('AI & Engineering Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('projects/:projectId/explain')
  @UseGuards(ProjectAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request source-grounded code explanation for snippet' })
  @SwaggerResponse({ status: 200, description: 'Structured code explanation' })
  async explainCode(
    @CurrentUser() user: UserProfile,
    @Param('projectId') projectId: string,
    @Body() dto: ExplainCodeDto
  ): Promise<CodeExplanationResponse> {
    return this.aiService.explainCode(user.id, projectId, dto);
  }

  @Post('projects/:projectId/chat')
  @UseGuards(ProjectAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with codebase using grounded source search context' })
  @SwaggerResponse({ status: 200, description: 'Grounded assistant reply with references' })
  async chatWithCodebase(
    @CurrentUser() user: UserProfile,
    @Param('projectId') projectId: string,
    @Body() dto: CodebaseChatDto
  ): Promise<CodebaseChatResponse> {
    return this.aiService.chatWithCodebase(user.id, projectId, dto);
  }

  @Get('projects/:projectId/chat/history/:conversationId')
  @UseGuards(ProjectAccessGuard)
  @ApiOperation({ summary: 'Retrieve conversation history for a thread' })
  @SwaggerResponse({ status: 200, description: 'List of historical chat messages' })
  async getChatHistory(
    @CurrentUser() user: UserProfile,
    @Param('projectId') projectId: string,
    @Param('conversationId') conversationId: string
  ): Promise<ChatMessage[]> {
    return this.aiService.getConversationMessages(user.id, projectId, conversationId);
  }

  @Post('findings/:findingId/suggest-fix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate targeted patch suggestion for a finding' })
  @SwaggerResponse({ status: 200, description: 'Proposed patch and explanation' })
  async suggestFix(
    @CurrentUser() user: UserProfile,
    @Param('findingId') findingId: string
  ): Promise<SuggestFixResponse> {
    return this.aiService.suggestFix(user.id, findingId);
  }

  @Patch('findings/:findingId/status')
  @ApiOperation({ summary: 'Update status of a finding (OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED)' })
  @SwaggerResponse({ status: 200, description: 'Updated finding item' })
  async updateStatus(
    @CurrentUser() user: UserProfile,
    @Param('findingId') findingId: string,
    @Body() dto: UpdateFindingStatusDto
  ): Promise<FindingItem> {
    return this.aiService.updateFindingStatus(user.id, findingId, dto);
  }

  @Get('projects/:projectId/analytics')
  @UseGuards(ProjectAccessGuard)
  @ApiOperation({ summary: 'Calculate repository analytics and findings distribution' })
  @SwaggerResponse({ status: 200, description: 'Repository analytics breakdown' })
  async getAnalytics(
    @CurrentUser() user: UserProfile,
    @Param('projectId') projectId: string
  ): Promise<RepositoryAnalytics> {
    return this.aiService.getProjectAnalytics(user.id, projectId);
  }
}
