import { IsNumber, IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { PriceSource } from '@prisma/client';

export class CreatePriceDto {
  @IsNumber()
  cropId: number;

  @IsNumber()
  marketId: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsNumber()
  pricePerKg: number;

  @IsOptional()
  @IsDateString()
  observationDate?: string;

  @IsOptional()
  @IsEnum(PriceSource)
  source?: PriceSource;

  @IsOptional()
  @IsString()
  sourceDetail?: string;
}