import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new BadRequestException('A user with this phone number already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        preferredLanguage: dto.preferredLanguage || 'OM',
        farmerProfile:
          dto.role === Role.FARMER
            ? { create: { name: dto.name || dto.phone, phone: dto.phone } }
            : undefined,
        buyerProfile:
          dto.role === Role.BUYER
            ? { create: { businessName: dto.name || dto.phone, phone: dto.phone } }
            : undefined,
        transporterProfile:
          dto.role === Role.TRANSPORTER
            ? { create: { name: dto.name || dto.phone, phone: dto.phone } }
            : undefined,
      },
    });
    return this.buildAuthResponse(user);
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const profile = await this.getProfile(user.id, user.role);
    const { passwordHash, ...safe } = user;
    return { ...safe, profile };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('This account has been suspended');
    }
    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: any) {
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const token = this.jwt.sign(payload);
    const profile = await this.getProfile(user.id, user.role);
    const { passwordHash, ...safe } = user;
    return {
      accessToken: token,
      user: { ...safe, profile },
    };
  }

  private async getProfile(userId: number, role: Role) {
    if (role === Role.FARMER) {
      return this.prisma.farmerProfile.findUnique({ where: { userId } });
    }
    if (role === Role.BUYER) {
      return this.prisma.buyerProfile.findUnique({ where: { userId } });
    }
    if (role === Role.TRANSPORTER) {
      return this.prisma.transporterProfile.findUnique({ where: { userId } });
    }
    return null;
  }
}
