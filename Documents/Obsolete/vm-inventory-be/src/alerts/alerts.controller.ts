import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsScheduler } from './alerts.scheduler';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly alertsScheduler: AlertsScheduler,
  ) {}

  @Roles('ADMIN', 'VIEWER')
  @Get()
  findAll() {
    return this.alertsService.findAll();
  }

  @Roles('ADMIN', 'VIEWER')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alertsService.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateAlertRuleDto) {
    return this.alertsService.create(dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAlertRuleDto,
  ) {
    return this.alertsService.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.alertsService.remove(id);
  }

  /** Manually trigger the scheduler check */
  @Roles('ADMIN')
  @Post('trigger')
  triggerNow() {
    return this.alertsScheduler.runNow();
  }
}
