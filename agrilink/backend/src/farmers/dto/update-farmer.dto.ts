import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';

export class UpdateFarmerProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  cooperative?: string;

  @IsOptional()
  @IsString()
  woreda?: string;

  @IsOptional()
  @IsString()
  kebele?: string;
}
