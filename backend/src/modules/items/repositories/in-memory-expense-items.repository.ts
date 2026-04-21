import { Injectable, NotFoundException } from '@nestjs/common';

import { generateId } from '@backend/common';
import {
  CreateExpenseItemInput,
  ExpenseItemRecord,
  UpdateExpenseItemInput,
} from '@backend/modules/items/items.types';
import { ExpenseItemsRepository } from '@backend/modules/items/repositories/expense-items.repository';

@Injectable()
export class InMemoryExpenseItemsRepository extends ExpenseItemsRepository {
  private readonly items = new Map<string, ExpenseItemRecord>();

  async create(input: CreateExpenseItemInput): Promise<ExpenseItemRecord> {
    const now = new Date();
    const item: ExpenseItemRecord = {
      id: generateId(),
      reportId: input.reportId,
      amount: input.amount ?? null,
      merchant: input.merchant ?? null,
      description: input.description ?? null,
      currency: input.currency ?? null,
      aiExtracted: input.aiExtracted ?? false,
      date: input.date ?? null,
      aiStatus: input.aiStatus,
      extractionError: input.extractionError ?? null,
      receiptObjectKey: input.receiptObjectKey ?? null,
      receiptOriginalName: input.receiptOriginalName ?? null,
      receiptMimeType: input.receiptMimeType ?? null,
      receiptSize: input.receiptSize ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(item.id, item);
    return cloneItem(item);
  }

  async findById(itemId: string): Promise<ExpenseItemRecord | null> {
    const item = this.items.get(itemId);
    return item ? cloneItem(item) : null;
  }

  async findByReportId(reportId: string): Promise<ExpenseItemRecord[]> {
    return Array.from(this.items.values())
      .filter((item) => item.reportId === reportId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map(cloneItem);
  }

  async update(itemId: string, patch: UpdateExpenseItemInput): Promise<ExpenseItemRecord> {
    const current = this.items.get(itemId);

    if (!current) {
      throw new NotFoundException('Expense item not found.');
    }

    const updated: ExpenseItemRecord = {
      ...current,
      ...patch,
      updatedAt: new Date(),
    };

    this.items.set(itemId, updated);
    return cloneItem(updated);
  }

  async delete(itemId: string): Promise<void> {
    if (!this.items.has(itemId)) {
      throw new NotFoundException('Expense item not found.');
    }

    this.items.delete(itemId);
  }
}

function cloneItem(item: ExpenseItemRecord): ExpenseItemRecord {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}
