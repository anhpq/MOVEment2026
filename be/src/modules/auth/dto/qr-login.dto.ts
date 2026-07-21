import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class QrLoginDto {
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceLabel?: string;
}
