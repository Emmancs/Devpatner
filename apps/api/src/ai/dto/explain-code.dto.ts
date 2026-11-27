import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class ExplainCodeDto {
  @ApiProperty({ example: 'src/auth/jwt.service.ts', description: 'Relative path of the source file' })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({ example: 'function verifyToken(token: string) { ... }', description: 'Source code snippet to explain' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 12, description: 'Starting line number of selected snippet' })
  @IsNumber()
  @IsOptional()
  startLine?: number;

  @ApiPropertyOptional({ example: 45, description: 'Ending line number of selected snippet' })
  @IsNumber()
  @IsOptional()
  endLine?: number;
}
