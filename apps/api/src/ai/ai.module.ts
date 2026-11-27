import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { CodeSearchService } from './code-search.service';
import { AuthModule } from '../auth/auth.module';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [AuthModule, GithubModule],
  controllers: [AiController],
  providers: [AiService, GeminiProvider, CodeSearchService],
  exports: [AiService, CodeSearchService, GeminiProvider],
})
export class AiModule {}
