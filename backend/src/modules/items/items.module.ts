import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExpenseItemEntity } from '@backend/infrastructure/persistence/entities/expense-item.entity';
import { ExpenseReportEntity } from '@backend/infrastructure/persistence/entities/expense-report.entity';
import { AiModule } from '@backend/modules/ai/ai.module';
import { StorageModule } from '@backend/modules/storage/storage.module';
import { ItemsController } from '@backend/modules/items/items.controller';
import { ItemsService } from '@backend/modules/items/items.service';
import { ExpenseItemsRepository } from '@backend/modules/items/repositories/expense-items.repository';
import { TypeOrmExpenseItemsRepository } from '@backend/modules/items/repositories/typeorm-expense-items.repository';
import { TypeOrmReportStateRepository } from '@backend/modules/items/repositories/typeorm-report-state.repository';
import { ReportStateRepository } from '@backend/modules/items/repositories/report-state.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExpenseItemEntity, ExpenseReportEntity]),
    StorageModule,
    forwardRef(() => AiModule),
  ],
  controllers: [ItemsController],
  providers: [
    ItemsService,
    TypeOrmExpenseItemsRepository,
    TypeOrmReportStateRepository,
    {
      provide: ExpenseItemsRepository,
      useExisting: TypeOrmExpenseItemsRepository,
    },
    {
      provide: ReportStateRepository,
      useExisting: TypeOrmReportStateRepository,
    },
  ],
  exports: [
    ItemsService,
    ExpenseItemsRepository,
    ReportStateRepository,
    TypeOrmExpenseItemsRepository,
    TypeOrmReportStateRepository,
  ],
})
export class ItemsModule {}
