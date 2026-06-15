import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  Request,
} from '@nestjs/common';
import { VmService } from './vm.service';
import { CreateVmDto } from './dto/create-vm.dto';
import { UpdateVmDto } from './dto/update-vm.dto';
import { QueryVmDto } from './dto/query-vm.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('vms')
export class VmController {
  constructor(private readonly vmService: VmService) {}

  @Public()
  @Get('stats')
  getStats() {
    return this.vmService.getStats();
  }

  @Public()
  @Get('expiring')
  findExpiring(
    @Query('days', new DefaultValuePipe(90), ParseIntPipe) days: number,
  ) {
    return this.vmService.findExpiring(days);
  }

  @Public()
  @Get()
  findAll(@Query() query: QueryVmDto) {
    return this.vmService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vmService.findOne(id);
  }

  @Roles('ADMIN', 'VIEWER')
  @Post()
  create(@Body() dto: CreateVmDto) {
    return this.vmService.create(dto);
  }

  @Roles('ADMIN', 'VIEWER')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVmDto,
    @Request() req,
  ) {
    return this.vmService.update(id, dto, req.user);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.vmService.remove(id, req.user);
  }
}
