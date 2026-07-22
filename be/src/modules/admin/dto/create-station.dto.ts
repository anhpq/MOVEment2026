import { StationTrackingMode } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStationDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/)
  @MaxLength(40)
  id!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsEnum(StationTrackingMode)
  trackingMode!: StationTrackingMode;

  @IsNumber()
  @Min(0)
  @Max(100)
  mapX!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  mapY!: number;

  @IsString()
  @MaxLength(80)
  gameType!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxPoints?: number;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  mediaUrl?: string | null;
}
