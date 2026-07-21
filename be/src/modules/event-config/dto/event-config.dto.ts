import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

const HH_MM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateEventConfigDto {
  @IsOptional()
  @IsString()
  @Matches(HH_MM_PATTERN)
  eventEndTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  notifyBeforeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cancelCooldownMinutes?: number;

  @IsOptional()
  @IsString()
  timezone?: string;
}
