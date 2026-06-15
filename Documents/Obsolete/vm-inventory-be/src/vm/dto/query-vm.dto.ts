import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class QueryVmDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  cluster?: string;

  @IsOptional()
  @IsString()
  kondisi?: string;

  @IsOptional()
  @IsString()
  statusOs?: string;

  @IsOptional()
  @IsString()
  kritikalitas?: string;

  @IsOptional()
  @IsString()
  vcenter?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  application?: string;

  @IsOptional()
  @IsString()
  osDetail?: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  department?: string;
}
