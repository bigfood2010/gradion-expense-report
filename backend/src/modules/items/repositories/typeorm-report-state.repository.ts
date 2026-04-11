import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExpenseReportEntity } from '@backend/infrastructure/persistence/entities/expense-report.entity';
import { ReportStateRecord } from '@backend/modules/items/items.types';
import { ReportStateRepository } from './report-state.repository';

@Injectable()
export class TypeOrmReportStateRepository extends ReportStateRepository {
  constructor(
    @InjectRepository(ExpenseReportEntity)
    private readonly repo: Repository<ExpenseReportEntity>,
  ) {
    super();
  }

  async findById(reportId: string): Promise<ReportStateRecord | null> {
    const entity = await this.repo.findOne({ where: { id: reportId } });
    if (!entity) return null;
    return { id: entity.id, userId: entity.userId, status: entity.status };
  }

  async save(record: ReportStateRecord): Promise<ReportStateRecord> {
    await this.repo.update({ id: record.id }, { status: record.status });
    return record;
  }
}
