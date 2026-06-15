import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsScheduler } from './alerts.scheduler';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, AlertsScheduler],
  exports: [AlertsService],
})
export class AlertsModule {}
