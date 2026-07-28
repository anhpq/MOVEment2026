import { StationTrackingMode } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { GAME_TYPES, GameType } from '../../../common/game/game-type';

export class UpdateStationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descriptionEn?: string | null;

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

  @IsOptional()
  @IsString()
  @MaxLength(80)
  checkInQrToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  checkOutQrToken?: string;
}
