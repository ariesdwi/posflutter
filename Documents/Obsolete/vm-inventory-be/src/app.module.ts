import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { VmModule } from './vm/vm.module';
import { ImportModule } from './import/import.module';
import { StatsModule } from './stats/stats.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { AppMappingModule } from './app-mapping/app-mapping.module';
import { SummaryModule } from './summary/summary.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,   // global — exports AuditService
    AuthModule,    // provides APP_GUARD (JwtAuthGuard + RolesGuard)
    VmModule,
    ImportModule,
    StatsModule,
    AlertsModule,
    AppMappingModule,
    SummaryModule,
  ],
})
export class AppModule {}
