import { StationTrackingMode } from '@prisma/client';
import { IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
import { GAME_TYPES, GameType } from '../../../common/game/game-type';

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
  @IsIn(GAME_TYPES)
  gameType?: GameType;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxPoints?: number;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  mediaUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  checkInQrToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  checkOutQrToken?: string;
}
