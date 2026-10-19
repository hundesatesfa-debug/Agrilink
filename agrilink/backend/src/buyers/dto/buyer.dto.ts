import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';
import { DemandStatus, BuyerStatus } from '@prisma/client';

export class UpdateBuyerProfileDto {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

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
  serviceArea?: string;

  @IsOptional()
  isCollector?: boolean;

  @IsOptional()
  @IsNumber()
  fee?: number;

  @IsOptional()
  @IsEnum(BuyerStatus)
  status?: BuyerStatus;
}

export class CreateDemandDto {
  @IsNumber()
  cropId: number;

  @IsOptional()
  @IsNumber()
  farmerId?: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  offeredPrice: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(DemandStatus)
  status?: DemandStatus;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateDemandDto {
  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  offeredPrice?: number;

  @IsOptional()
  @IsEnum(DemandStatus)
  status?: DemandStatus;
}