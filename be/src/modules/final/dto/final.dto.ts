import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SubmitFinalDto {
  @IsString()
  answer!: string;
}

export class UpdateFinalConfigDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  clueText?: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxWinners?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  pointsByRank?: number[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
