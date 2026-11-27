import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CodebaseChatDto {
  @ApiProperty({
    example: 'Where is authentication implemented and how are session tokens verified?',
    description: 'User question about the codebase',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Message query cannot exceed 2000 characters' })
  message: string;

  @ApiPropertyOptional({
    example: 'conv-uuid-1234',
    description: 'Existing conversation ID to continue conversation thread',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;
}
