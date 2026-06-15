import { Module } from '@nestjs/common';
import { VmController } from './vm.controller';
import { VmService } from './vm.service';

@Module({
  controllers: [VmController],
  providers: [VmService],
})
export class VmModule {}
