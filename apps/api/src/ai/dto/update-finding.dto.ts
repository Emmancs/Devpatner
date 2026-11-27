import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FindingStatus } from '@devpilot/shared';

export class UpdateFindingStatusDto {
  @ApiProperty({ enum: FindingStatus, example: FindingStatus.ACKNOWLEDGED, description: 'Updated finding triage status' })
  @IsEnum(FindingStatus)
  @IsNotEmpty()
  status: FindingStatus;
}
