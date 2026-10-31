import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'my-service-api-v2', description: 'Updated project name' })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Project name must be at least 2 characters' })
  @MaxLength(100, { message: 'Project name cannot exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({ description: 'Updated project description' })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({ example: 'develop', description: 'Updated default branch' })
  @IsString()
  @IsOptional()
  defaultBranch?: string;

  @ApiPropertyOptional({ description: 'Archive status of the project' })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}

