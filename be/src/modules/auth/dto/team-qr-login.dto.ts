import { IsOptional, IsString, MinLength } from 'class-validator';

export class TeamQrLoginDto {
  @IsString()
  @MinLength(1)
  qrToken!: string;

  @IsOptional()
  @IsString()
  deviceLabel?: string;
}
