import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CodeExplanationDto {
  @ApiProperty({ example: 'src/auth/jwt.service.ts', description: 'Relative path of the source file' })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({ example: 'function verifyToken(token: string) { ... }', description: 'Source code snippet' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 10, description: 'Starting line number' })
  @IsInt()
  @Min(1)
  @IsOptional()
  startLine?: number;

  @ApiPropertyOptional({ example: 35, description: 'Ending line number' })
  @IsInt()
  @Min(1)
  @IsOptional()
  endLine?: number;
}
