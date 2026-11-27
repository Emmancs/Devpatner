import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { StaticAnalyzerService } from './static-analyzer.service';
import { GithubModule } from '../github/github.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [GithubModule, AiModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, StaticAnalyzerService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
