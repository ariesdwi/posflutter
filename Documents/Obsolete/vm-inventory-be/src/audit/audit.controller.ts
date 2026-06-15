import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Roles('ADMIN', 'AUDITOR')
  @Get()
  findAll(@Query('entity') entity?: string) {
    return this.auditService.findAll(entity);
  }
}
