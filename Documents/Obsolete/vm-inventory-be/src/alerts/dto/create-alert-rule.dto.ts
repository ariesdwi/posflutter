import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class CreateAlertRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  webhookUrl: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
