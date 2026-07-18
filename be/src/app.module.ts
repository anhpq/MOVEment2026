import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/validate-environment';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventConfigModule } from './modules/event-config/event-config.module';
import { FinalModule } from './modules/final/final.module';
import { PlayerModule } from './modules/player/player.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    AuthModule,
    EventConfigModule,
    PlayerModule,
    AdminModule,
    FinalModule,
  ],
})
export class AppModule {}
