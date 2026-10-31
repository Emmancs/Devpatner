import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AttachRepositoryDto {
  @ApiProperty({ example: 'octocat/Hello-World' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^/]+\/[^/]+$/, { message: 'fullName must use the owner/name format.' })
  fullName: string;
}
