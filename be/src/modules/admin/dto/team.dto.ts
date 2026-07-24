import { IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  username!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  captainName?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  teamColor?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string | null;
}

export class UpdateTeamDto {

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  captainName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  qrToken?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  teamColor?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string | null;
}
