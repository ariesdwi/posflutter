import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class QueryAppMappingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  kritikalitas?: string;
}
