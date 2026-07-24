import { StationTrackingMode } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { GAME_TYPES, GameType } from '../../../common/game/game-type';

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

  @IsIn(GAME_TYPES)
  gameType!: GameType;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxPoints?: number;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  mediaUrl?: string | null;
}
