import { ProgressStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SubmitScoreDto {
  @IsInt()
  @Min(0)
  score!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AdminScoreDto {
  @IsInt()
  @Min(0)
  score!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class ReopenProgressDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class ForceProgressStatusDto {
  @IsEnum(ProgressStatus)
  status!: ProgressStatus;

  @IsString()
  @MaxLength(500)
  reason!: string;
}
