import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateProducePostDto {
  @IsInt()
  @Type(() => Number)
  cropId: number;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerUnit?: number;
}
