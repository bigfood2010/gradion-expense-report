import { IsEnum, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '@backend/common';
import { ExpenseReportStatus } from '@backend/modules/reports/reports.types';

export class ListExpenseReportsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ExpenseReportStatus)
  status?: ExpenseReportStatus;
}
