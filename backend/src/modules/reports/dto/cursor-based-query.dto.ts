import { IsEnum, IsOptional } from 'class-validator';

import { CursorQueryDto } from '@backend/common';
import { ExpenseReportStatus } from '@backend/modules/reports/reports.types';

export class CursorBasedQueryDto extends CursorQueryDto {
  @IsOptional()
  @IsEnum(ExpenseReportStatus)
  status?: ExpenseReportStatus;
}
