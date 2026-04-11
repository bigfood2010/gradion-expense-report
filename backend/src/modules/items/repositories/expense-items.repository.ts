import {
  CreateExpenseItemInput,
  ExpenseItemRecord,
  UpdateExpenseItemInput,
} from '@backend/modules/items/items.types';

export abstract class ExpenseItemsRepository {
  abstract create(input: CreateExpenseItemInput): Promise<ExpenseItemRecord>;

  abstract findById(itemId: string): Promise<ExpenseItemRecord | null>;

  abstract findByReportId(reportId: string): Promise<ExpenseItemRecord[]>;

  abstract update(itemId: string, patch: UpdateExpenseItemInput): Promise<ExpenseItemRecord>;

  abstract delete(itemId: string): Promise<void>;
}
