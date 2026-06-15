import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AppMappingController } from './app-mapping.controller';
import { AppMappingService } from './app-mapping.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
  ],
  controllers: [AppMappingController],
  providers: [AppMappingService],
  exports: [AppMappingService],
})
export class AppMappingModule {}
