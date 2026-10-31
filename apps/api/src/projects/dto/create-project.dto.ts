import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'my-service-api', description: 'Project name' })
  @IsString()
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(2, { message: 'Project name must be at least 2 characters' })
  @MaxLength(100, { message: 'Project name cannot exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    example: 'Core microservice handling payment authorization and fraud detection',
    description: 'Detailed description of the project',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({ example: 'main', description: 'Default branch for analysis', default: 'main' })
  @IsString()
  @IsOptional()
  defaultBranch?: string;
}

