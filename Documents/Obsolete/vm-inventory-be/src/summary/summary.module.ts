import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SummaryController],
  providers: [SummaryService],
  exports: [SummaryService],
})
export class SummaryModule {}
