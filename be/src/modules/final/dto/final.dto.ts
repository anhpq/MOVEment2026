import {
  IsBoolean,
  IsOptional,
  IsString,
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
  @IsBoolean()
  isActive?: boolean;
}
