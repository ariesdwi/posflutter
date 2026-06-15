import {
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateVmDto {
  @IsOptional()
  @IsInt()
  no?: number;

  @IsOptional()
  @IsString()
  namaList?: string;

  @IsOptional()
  @IsString()
  kondisi?: string;

  @IsOptional()
  @IsString()
  cluster?: string;

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsString()
  compatibility?: string;

  @IsOptional()
  @IsString()
  guestOs?: string;

  @IsOptional()
  @IsString()
  provisionedSpace?: string;

  @IsOptional()
  @IsString()
  usedSpace?: string;

  @IsOptional()
  @IsString()
  memorySize?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  cpus?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  nics?: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  uuid?: string;

  @IsOptional()
  @IsString()
  uptime?: string;

  @IsOptional()
  @IsString()
  datastore?: string;

  @IsOptional()
  @IsString()
  application?: string;

  @IsOptional()
  @IsString()
  component?: string;

  @IsOptional()
  @IsString()
  kritikalitas?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  osDetail?: string;

  @IsOptional()
  @IsString()
  ipDetail?: string;

  @IsOptional()
  @IsString()
  maOwner?: string;

  @IsOptional()
  @IsString()
  maOps?: string;

  @IsOptional()
  @IsString()
  maDev?: string;

  @IsOptional()
  @IsString()
  vcenter?: string;

  @IsOptional()
  @IsString()
  endSupportDate?: string;

  @IsOptional()
  @IsString()
  statusOs?: string;

  @IsOptional()
  @IsString()
  detailStatus?: string;

  @IsOptional()
  @IsString()
  keterangan?: string;
}
