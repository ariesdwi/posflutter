import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum OsType {
  Ubuntu = 'Ubuntu',
  CentOS = 'CentOS',
}

export class QueryObsoleteDto {
  @IsEnum(OsType, { message: 'osType must be Ubuntu or CentOS' })
  osType: OsType;
}

export class QueryAppMappingDto {
  @IsEnum(OsType, { message: 'osType must be Ubuntu or CentOS' })
  osType: OsType;

  @IsOptional()
  @IsString()
  category?: string = 'Production';
}

export class QueryDepartmentDto {
  @IsOptional()
  @IsEnum(OsType, { message: 'osType must be Ubuntu or CentOS' })
  osType?: OsType;
}
