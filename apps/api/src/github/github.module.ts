import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GithubController } from './github.controller';
import { GithubCryptoService } from './crypto.service';
import { GithubService } from './github.service';
import { RepositoriesController } from './repositories.controller';
import { RepositoryService } from './repository.service';

@Module({
  imports: [AuthModule],
  controllers: [GithubController, RepositoriesController],
  providers: [GithubCryptoService, GithubService, RepositoryService],
  exports: [GithubService],
})
export class GithubModule {}
