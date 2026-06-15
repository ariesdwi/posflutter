import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { parse } from 'csv-parse/sync';
import { AppMappingService } from './app-mapping.service';
import { QueryAppMappingDto } from './dto/query-app-mapping.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

const VALID_DEPARTMENTS = new Set([
  'Core Development Department',
  'Corporate & Outlet Delivery Development Department',
  'Digital Ecosystem Development Department',
  'Digital Retail Development Department',
  'Digital Wholesale Development Department',
  'Enterprise Service Development Department',
  'Financial System Development Department',
  'IT Development Management Departement',
  'Middleware Development Department',
]);

@Controller('app-mapping')
export class AppMappingController {
  constructor(private readonly service: AppMappingService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryAppMappingDto) {
    return this.service.findAll(query);
  }

  @Public()
  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  @Public()
  @Get('teams')
  getTeams() {
    return this.service.getTeams();
  }

  @Public()
  @Get('departments')
  getDepartments() {
    return this.service.getDepartments();
  }

  @Roles('ADMIN')
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('truncate') truncate?: string,
  ) {
    if (!file) throw new BadRequestException('file is required');

    let records: Record<string, string>[];
    try {
      records = parse(file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_quotes: true,
        relax_column_count: true,
      }) as Record<string, string>[];
    } catch {
      throw new BadRequestException('Failed to parse CSV');
    }

    const mapped = records
      .filter((r) => VALID_DEPARTMENTS.has(r['Department Baru']?.trim()))
      .map((r) => ({
        department: r['Department Baru']?.trim() || undefined,
        team: r['Team Baru']?.trim() || undefined,
        aplikasi: r['Aplikasi']?.trim() || undefined,
        applicationOwner: r['Application Owner']?.trim() || undefined,
        platformOwner: r['Platform Owner']?.trim() || undefined,
        kritikalitas: r['Kritikalis 2025']?.trim() || undefined,
        squadLead: r['Nama SAD/Squad Lead']?.trim() || undefined,
        keterangan: r['Keterangan']?.trim() || undefined,
        support24h: r['Support 24h']?.trim() || undefined,
        target24h: r['Target 24h']?.trim() || undefined,
      }));

    if (mapped.length === 0) {
      throw new BadRequestException('No valid rows found in CSV');
    }

    return this.service.importRecords(mapped, truncate === 'true');
  }
}
