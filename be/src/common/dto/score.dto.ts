import { ProgressStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class SubmitScoreDto {
  @IsInt()
  @Min(0)
  score!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class TeamSubmitScoreDto extends SubmitScoreDto {
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  confirmationCode!: string;
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
