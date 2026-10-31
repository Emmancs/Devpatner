import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnalysisDto {
  @ApiPropertyOptional({ example: 'main', description: 'Branch to analyze; defaults to the repository default branch.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  branch?: string;
}
