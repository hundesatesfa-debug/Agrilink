import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { FarmersModule } from './farmers/farmers.module';
import { FarmsModule } from './farms/farms.module';
import { CropsModule } from './crops/crops.module';
import { MarketsModule } from './markets/markets.module';
import { PricesModule } from './prices/prices.module';
import { BuyersModule } from './buyers/buyers.module';
import { TransportModule } from './transport/transport.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FarmersModule,
    FarmsModule,
    CropsModule,
    MarketsModule,
    PricesModule,
    BuyersModule,
    TransportModule,
    TransactionsModule,
    RecommendationsModule,
    NotificationsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
