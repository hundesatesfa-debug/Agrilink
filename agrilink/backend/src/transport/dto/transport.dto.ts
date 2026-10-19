import { IsString, IsOptional, IsNumber, IsNotEmpty, IsDateString, Min, IsEnum } from 'class-validator';
import { ShipmentStatus } from '@prisma/client';

export class UpdateTransporterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  serviceArea?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  available?: boolean;
}

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @IsNumber()
  @Min(1)
  capacityKg: number;
}

export class CreateTransportRequestDto {
  @IsNumber()
  pickupLat: number;

  @IsNumber()
  pickupLng: number;

  @IsString()
  pickupLabel: string;

  @IsNumber()
  destLat: number;

  @IsNumber()
  destLng: number;

  @IsString()
  destLabel: string;

  @IsOptional()
  @IsNumber()
  cropId?: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;
}

export class UpdateTransportRequestDto {
  @IsOptional()
  @IsNumber()
  transporterId?: number;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  status?: string;
}

export class UpdateShipmentStatusDto {
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @IsOptional()
  @IsNumber()
  currentLat?: number;

  @IsOptional()
  @IsNumber()
  currentLng?: number;
}