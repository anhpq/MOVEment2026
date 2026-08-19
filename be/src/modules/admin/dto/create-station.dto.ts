import { StationTrackingMode } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsIn,
  IsNotEmpty,
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
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameEn!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descriptionEn?: string | null;

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
  maxPoints?: number | null;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  mediaUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((item) => (typeof item === 'string' ? item.trim() : item))
      : value,
  )
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  imageUrls?: string[];
}
