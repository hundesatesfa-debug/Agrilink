import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';

export class CreateFarmDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  landSize?: number;

  @IsOptional()
  @IsString()
  woreda?: string;

  @IsOptional()
  @IsString()
  kebele?: string;
}

export class UpdateFarmDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  landSize?: number;

  @IsOptional()
  @IsString()
  woreda?: string;

  @IsOptional()
  @IsString()
  kebele?: string;
}

export class AddFarmCropDto {
  @IsNumber()
  cropId: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsNumber()
  expectedYield: number;

  @IsOptional()
  @IsDateString()
  harvestStart?: string;

  @IsOptional()
  @IsDateString()
  harvestEnd?: string;
}
