import { IsString, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role, Language } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Language)
  preferredLanguage?: Language;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
