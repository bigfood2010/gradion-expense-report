import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateExpenseItemDto {
  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  amount?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @IsString()
  @Length(1, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  aiExtracted?: boolean;
}
