import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

export class ExecuteEventPreparationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  confirmation!: string;

  @IsBoolean()
  backupConfirmed!: boolean;
}
