import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ProjectAccessGuard } from './guards/project-access.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtAuthGuard, ProjectAccessGuard],
  exports: [AuthService, TokenService, JwtAuthGuard, ProjectAccessGuard],
})
export class AuthModule {}
