import { StationTrackingMode } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class UpdateStationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsEnum(StationTrackingMode)
  trackingMode?: StationTrackingMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  mapX?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  mapY?: number;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  mediaUrl?: string | null;
}
