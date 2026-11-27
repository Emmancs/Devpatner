import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FindingStatus } from '@devpilot/shared';

export class UpdateFindingStatusDto {
  @ApiProperty({
    enum: FindingStatus,
    example: FindingStatus.ACKNOWLEDGED,
    description: 'Updated finding status',
  })
  @IsEnum(FindingStatus, { message: 'Status must be one of OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED' })
  @IsNotEmpty()
  status: FindingStatus;
}
