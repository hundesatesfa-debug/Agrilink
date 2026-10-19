import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsOptional()
  @IsNumber()
  buyerId?: number;

  @IsOptional()
  @IsNumber()
  marketId?: number;

  @IsNumber()
  cropId: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  agreedPrice: number;

  @IsOptional()
  @IsNumber()
  transportCost?: number;

  @IsOptional()
  @IsNumber()
  otherFees?: number;

  @IsOptional()
  @IsNumber()
  shipmentId?: number;
}

export class UpdateTransactionStatusDto {
  @IsString()
  status: string;
}