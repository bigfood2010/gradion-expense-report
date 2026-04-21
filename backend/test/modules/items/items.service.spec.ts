import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ExtractionDispatcherRepository } from '@backend/modules/ai/extraction-dispatcher.repository';
import {
  AI_STATUS,
  CreateExpenseItemInput,
  ExpenseItemRecord,
  REPORT_STATUS,
  ReportStateRecord,
  UpdateExpenseItemInput,
} from '@backend/modules/items/items.types';
import { ExpenseItemsRepository } from '@backend/modules/items/repositories/expense-items.repository';
import { ReportStateRepository } from '@backend/modules/items/repositories/report-state.repository';
import { ItemsService } from '@backend/modules/items/items.service';
import { ReceiptStorageRepository } from '@backend/modules/storage/receipt-storage.repository';
import { StoredReceipt, UploadReceiptInput } from '@backend/modules/storage/storage.types';

// ---------------------------------------------------------------------------
// In-memory fakes
// ---------------------------------------------------------------------------

class InMemoryExpenseItemsRepository extends ExpenseItemsRepository {
  private readonly items: ExpenseItemRecord[] = [];
  private nextId = 1;

  async create(input: CreateExpenseItemInput): Promise<ExpenseItemRecord> {
    const item: ExpenseItemRecord = {
      id: `item-${this.nextId++}`,
      reportId: input.reportId,
      merchant: input.merchant ?? null,
      description: input.description ?? null,
      amount: input.amount ?? null,
      currency: input.currency ?? null,
      date: input.date ?? null,
      aiStatus: input.aiStatus,
      aiExtracted: input.aiExtracted ?? false,
      extractionError: input.extractionError ?? null,
      receiptObjectKey: input.receiptObjectKey ?? null,
      receiptOriginalName: input.receiptOriginalName ?? null,
      receiptMimeType: input.receiptMimeType ?? null,
      receiptSize: input.receiptSize ?? null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
    this.items.push(item);
    return item;
  }

  async findById(itemId: string): Promise<ExpenseItemRecord | null> {
    return this.items.find((i) => i.id === itemId) ?? null;
  }

  async findByReportId(reportId: string): Promise<ExpenseItemRecord[]> {
    return this.items.filter((i) => i.reportId === reportId);
  }

  async update(itemId: string, patch: UpdateExpenseItemInput): Promise<ExpenseItemRecord> {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Expense item not found.');
    Object.assign(item, patch);
    return item;
  }

  async delete(itemId: string): Promise<void> {
    const idx = this.items.findIndex((i) => i.id === itemId);
    if (idx === -1) throw new NotFoundException('Expense item not found.');
    this.items.splice(idx, 1);
  }
}

class InMemoryReportStateRepository extends ReportStateRepository {
  constructor(private readonly reports: ReportStateRecord[] = []) {
    super();
  }

  async findById(reportId: string): Promise<ReportStateRecord | null> {
    return this.reports.find((r) => r.id === reportId) ?? null;
  }

  async save(report: ReportStateRecord): Promise<ReportStateRecord> {
    const idx = this.reports.findIndex((r) => r.id === report.id);
    if (idx === -1) {
      this.reports.push(report);
    } else {
      this.reports[idx] = report;
    }
    return report;
  }
}

class InMemoryReceiptStorageRepository extends ReceiptStorageRepository {
  uploadedKeys: string[] = [];
  deletedKeys: string[] = [];

  async uploadReceipt(input: UploadReceiptInput): Promise<StoredReceipt> {
    const key = `receipts/${input.reportId}/${Date.now()}.jpg`;
    this.uploadedKeys.push(key);
    return {
      objectKey: key,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
    };
  }

  async getReceiptUrl(objectKey: string): Promise<string> {
    return `http://minio/receipts/${objectKey}`;
  }

  async readReceipt(_objectKey: string): Promise<Buffer> {
    return Buffer.from('fake-image-data');
  }

  async deleteReceipt(objectKey: string): Promise<void> {
    this.deletedKeys.push(objectKey);
  }
}

class InMemoryExtractionDispatcherRepository extends ExtractionDispatcherRepository {
  dispatchedItemIds: string[] = [];

  async dispatch(itemId: string): Promise<void> {
    this.dispatchedItemIds.push(itemId);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReport(overrides: Partial<ReportStateRecord> = {}): ReportStateRecord {
  return {
    id: 'report-1',
    userId: 'user-1',
    status: REPORT_STATUS.DRAFT,
    ...overrides,
  };
}

function makeUploadFile() {
  return {
    buffer: Buffer.from('fake-receipt'),
    mimetype: 'text/plain',
    originalname: 'receipt.txt',
    size: 1024,
  };
}

function makeService(reports: ReportStateRecord[] = [makeReport()]) {
  const itemsRepo = new InMemoryExpenseItemsRepository();
  const reportStateRepo = new InMemoryReportStateRepository(reports);
  const storageRepo = new InMemoryReceiptStorageRepository();
  const dispatcherRepo = new InMemoryExtractionDispatcherRepository();

  const service = new ItemsService(itemsRepo, reportStateRepo, storageRepo, dispatcherRepo);

  return { service, itemsRepo, reportStateRepo, storageRepo, dispatcherRepo };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ItemsService', () => {
  describe('uploadReceipt', () => {
    it('throws BadRequestException when no file is provided', async () => {
      const { service } = makeService();

      await expect(service.uploadReceipt('report-1', 'user-1', undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when the report does not exist', async () => {
      const { service } = makeService([]);

      await expect(
        service.uploadReceipt('non-existent', 'user-1', makeUploadFile()),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when a different user tries to upload', async () => {
      const { service } = makeService([makeReport({ userId: 'user-1' })]);

      await expect(service.uploadReceipt('report-1', 'user-99', makeUploadFile())).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ConflictException when report is SUBMITTED', async () => {
      const { service } = makeService([makeReport({ status: REPORT_STATUS.SUBMITTED })]);

      await expect(service.uploadReceipt('report-1', 'user-1', makeUploadFile())).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates item with PROCESSING status and dispatches extraction when no manual data', async () => {
      const { service, itemsRepo, dispatcherRepo } = makeService();

      const result = await service.uploadReceipt('report-1', 'user-1', makeUploadFile());

      expect(result.item.aiStatus).toBe(AI_STATUS.PROCESSING);
      const stored = await itemsRepo.findById(result.item.id);
      expect(stored?.receiptObjectKey).toBeTruthy();
      expect(dispatcherRepo.dispatchedItemIds).toContain(result.item.id);
    });

    it('creates item with COMPLETED status and skips extraction when manual data is provided', async () => {
      const { service, dispatcherRepo } = makeService();

      const result = await service.uploadReceipt('report-1', 'user-1', makeUploadFile(), {
        merchant: 'Starbucks',
        amount: '12.50',
        currency: 'USD',
        date: '2026-01-01',
      });

      expect(result.item.aiStatus).toBe(AI_STATUS.COMPLETED);
      expect(dispatcherRepo.dispatchedItemIds).toHaveLength(0);
    });

    it('uploads receipt file to storage', async () => {
      const { service, storageRepo } = makeService();

      await service.uploadReceipt('report-1', 'user-1', makeUploadFile());

      expect(storageRepo.uploadedKeys).toHaveLength(1);
    });

    it('re-opens a REJECTED report before allowing upload', async () => {
      const { service, reportStateRepo } = makeService([
        makeReport({ status: REPORT_STATUS.REJECTED }),
      ]);

      await service.uploadReceipt('report-1', 'user-1', makeUploadFile());

      const report = await reportStateRepo.findById('report-1');
      expect(report?.status).toBe(REPORT_STATUS.DRAFT);
    });
  });

  describe('updateItem', () => {
    it('throws BadRequestException when no fields are provided', async () => {
      const { service } = makeService();
      await expect(service.updateItem('item-1', 'user-1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when item does not exist', async () => {
      const { service } = makeService();
      await expect(
        service.updateItem('non-existent', 'user-1', { merchant: 'Foo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates item fields', async () => {
      const { service } = makeService();
      const upload = await service.uploadReceipt('report-1', 'user-1', makeUploadFile());

      const updated = await service.updateItem(upload.item.id, 'user-1', {
        merchant: 'Costa Coffee',
        amount: '9.99',
      });

      expect(updated.item.merchant).toBe('Costa Coffee');
      expect(updated.item.amount).toBe('9.99');
    });
  });

  describe('deleteItem', () => {
    it('throws NotFoundException when item does not exist', async () => {
      const { service } = makeService();
      await expect(service.deleteItem('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('deletes item and its stored receipt', async () => {
      const { service, itemsRepo, storageRepo } = makeService();
      const upload = await service.uploadReceipt('report-1', 'user-1', makeUploadFile());
      const itemId = upload.item.id;

      await service.deleteItem(itemId, 'user-1');

      expect(await itemsRepo.findById(itemId)).toBeNull();
      expect(storageRepo.deletedKeys).toHaveLength(1);
    });
  });

  describe('listByReportId', () => {
    it('throws NotFoundException when report does not exist', async () => {
      const { service } = makeService([]);
      await expect(service.listByReportId('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user does not own the report', async () => {
      const { service } = makeService([makeReport({ userId: 'owner' })]);
      await expect(service.listByReportId('report-1', 'intruder')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns items for the report', async () => {
      const { service } = makeService();
      await service.uploadReceipt('report-1', 'user-1', makeUploadFile());
      await service.uploadReceipt('report-1', 'user-1', makeUploadFile());

      const result = await service.listByReportId('report-1', 'user-1');

      expect(result.items).toHaveLength(2);
    });
  });
});
