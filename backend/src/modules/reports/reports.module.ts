import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExpenseReportEntity } from '@backend/modules/reports/entities/expense-report.entity';
import { ExpenseReportsRepository } from '@backend/modules/reports/repository/expense-reports.repository';
import { TypeOrmExpenseReportsRepository } from '@backend/modules/reports/repository/typeorm-expense-reports.repository';
import {
  AdminReportsController,
  ReportsController,
} from '@backend/modules/reports/reports.controller';
import { ReportsService } from '@backend/modules/reports/reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseReportEntity])],
  controllers: [ReportsController, AdminReportsController],
  providers: [
    ReportsService,
    TypeOrmExpenseReportsRepository,
    {
      provide: ExpenseReportsRepository,
      useExisting: TypeOrmExpenseReportsRepository,
    },
  ],
  exports: [ReportsService, ExpenseReportsRepository],
})
export class ReportsModule {}
