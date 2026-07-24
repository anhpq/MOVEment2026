import { IsString, MinLength } from 'class-validator';

export class QrActionDto {
  @IsString()
  @MinLength(1)
  qrToken!: string;
}
