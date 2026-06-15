import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { 
  SummaryService, 
  ManagementSummary, 
  ObsoleteSummary, 
  AppDepartmentMapping 
} from './summary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('summary')
@UseGuards(JwtAuthGuard)
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  /**
   * GET /api/summary/management
   * Comprehensive management report with all summaries
   */
  @Get('management')
  async getManagementSummary(): Promise<ManagementSummary> {
    return this.summaryService.getManagementSummary();
  }

  /**
   * GET /api/summary/obsolete?osType=Ubuntu
   * Summary of obsolete VMs for specific OS
   */
  @Get('obsolete')
  async getObsoleteSummary(
    @Query('osType') osType: 'Ubuntu' | 'CentOS',
  ): Promise<ObsoleteSummary | { error: string }> {
    if (!osType || !['Ubuntu', 'CentOS'].includes(osType)) {
      return {
        error: 'Please specify osType as Ubuntu or CentOS',
      };
    }
    return this.summaryService.getObsoleteSummary(osType);
  }

  /**
   * GET /api/summary/app-mapping?osType=Ubuntu&category=Production
   * Application-department mapping for specific OS
   */
  @Get('app-mapping')
  async getAppDepartmentMapping(
    @Query('osType') osType: 'Ubuntu' | 'CentOS',
    @Query('category') category: string = 'Production',
  ): Promise<AppDepartmentMapping | { error: string }> {
    if (!osType || !['Ubuntu', 'CentOS'].includes(osType)) {
      return {
        error: 'Please specify osType as Ubuntu or CentOS',
      };
    }
    return this.summaryService.getAppDepartmentMapping(osType, category);
  }

  /**
   * GET /api/summary/by-department?osType=Ubuntu
   * Summary grouped by department
   */
  @Get('by-department')
  async getSummaryByDepartment(@Query('osType') osType?: 'Ubuntu' | 'CentOS') {
    if (osType && !['Ubuntu', 'CentOS'].includes(osType)) {
      return {
        error: 'osType must be Ubuntu or CentOS if provided',
      };
    }
    return this.summaryService.getSummaryByDepartment(osType);
  }
}
