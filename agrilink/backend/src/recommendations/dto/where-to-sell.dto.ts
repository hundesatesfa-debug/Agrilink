import { IsNumber, IsOptional, Min, IsString } from 'class-validator';

export class WhereToSellDto {
  @IsNumber()
  cropId: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  farmId?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  grade?: string;
}

export interface MarketOption {
  marketId: number;
  marketName: string;
  marketNameOm: string;
  city: string;
  latitude: number;
  longitude: number;
  pricePerKg: number | null;
  grade: string | null;
  priceDate: Date | null;
  grossRevenue: number | null;
  distanceKm: number | null;
  distanceMethod?: 'mapbox' | 'haversine';
  transportCost: number | null;
  transitFees: number;
  netRevenue: number | null;
  reason?: string;
}

export interface RecommendationResult {
  recommended: MarketOption | null;
  alternatives: MarketOption[];
  cropName: string;
  cropNameOm: string;
  quantity: number;
  origin: { latitude: number; longitude: number; label: string };
  calculationNote: string;
}