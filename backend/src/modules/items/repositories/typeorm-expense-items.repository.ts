import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExpenseItemEntity } from '@backend/infrastructure/persistence/entities/expense-item.entity';
import {
  CreateExpenseItemInput,
  ExpenseItemRecord,
  UpdateExpenseItemInput,
} from '@backend/modules/items/items.types';
import { ExpenseItemAIStatus } from '@backend/modules/reports/reports.types';
import { ExpenseItemsRepository } from './expense-items.repository';

@Injectable()
export class TypeOrmExpenseItemsRepository extends ExpenseItemsRepository {
  constructor(
    @InjectRepository(ExpenseItemEntity)
    private readonly repo: Repository<ExpenseItemEntity>,
  ) {
    super();
  }

  async create(input: CreateExpenseItemInput): Promise<ExpenseItemRecord> {
    const entity = this.repo.create({
      reportId: input.reportId,
      merchant: input.merchant ?? null,
      description: input.description ?? null,
      amount: input.amount !== null && input.amount !== undefined ? Number(input.amount) : null,
      currency: input.currency ?? null,
      date: input.date ?? null,
      aiStatus: input.aiStatus,
      aiExtracted: input.aiExtracted ?? false,
      extractionError: input.extractionError ?? null,
      receiptObjectKey: input.receiptObjectKey ?? null,
      receiptOriginalName: input.receiptOriginalName ?? null,
      receiptMimeType: input.receiptMimeType ?? null,
      receiptSize: input.receiptSize ?? null,
    });

    const saved = await this.repo.save(entity);
    return toRecord(saved);
  }

  async findById(itemId: string): Promise<ExpenseItemRecord | null> {
    const entity = await this.repo.findOne({ where: { id: itemId } });
    return entity ? toRecord(entity) : null;
  }

  async findByReportId(reportId: string): Promise<ExpenseItemRecord[]> {
    const entities = await this.repo.find({
      where: { reportId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(toRecord);
  }

  async update(itemId: string, patch: UpdateExpenseItemInput): Promise<ExpenseItemRecord> {
    const current = await this.repo.findOne({ where: { id: itemId } });
    if (!current) throw new NotFoundException('Expense item not found.');

    const updates: Partial<ExpenseItemEntity> = {};

    if (patch.merchant !== undefined) updates.merchant = patch.merchant;
    if (patch.description !== undefined) updates.description = patch.description;
    if (patch.amount !== undefined) {
      updates.amount = patch.amount !== null ? Number(patch.amount) : null;
    }
    if (patch.currency !== undefined) updates.currency = patch.currency;
    if (patch.date !== undefined) updates.date = patch.date;
    if (patch.aiStatus !== undefined) updates.aiStatus = patch.aiStatus;
    if (patch.aiExtracted !== undefined) updates.aiExtracted = patch.aiExtracted;
    if (patch.extractionError !== undefined) updates.extractionError = patch.extractionError;

    await this.repo.update({ id: itemId }, updates);

    const updated = await this.repo.findOne({ where: { id: itemId } });
    return toRecord(updated!);
  }

  async delete(itemId: string): Promise<void> {
    const result = await this.repo.delete({ id: itemId });
    if (result.affected === 0) throw new NotFoundException('Expense item not found.');
  }
}

function toRecord(entity: ExpenseItemEntity): ExpenseItemRecord {
  return {
    id: entity.id,
    reportId: entity.reportId,
    merchant: entity.merchant,
    description: entity.description,
    amount: entity.amount !== null && entity.amount !== undefined ? entity.amount.toFixed(2) : null,
    currency: entity.currency,
    date: entity.date,
    aiStatus: entity.aiStatus as ExpenseItemAIStatus,
    aiExtracted: entity.aiExtracted,
    extractionError: entity.extractionError,
    receiptObjectKey: entity.receiptObjectKey,
    receiptOriginalName: entity.receiptOriginalName,
    receiptMimeType: entity.receiptMimeType,
    receiptSize: entity.receiptSize,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
