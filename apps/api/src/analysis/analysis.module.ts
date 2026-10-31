import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GithubModule } from '../github/github.module';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { StaticAnalyzerService } from './static-analyzer.service';

@Module({
  imports: [AuthModule, GithubModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, StaticAnalyzerService],
})
export class AnalysisModule {}
