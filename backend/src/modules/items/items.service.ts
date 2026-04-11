import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EXTRACTION_DISPATCHER } from '@backend/modules/ai/ai.tokens';
import { ExtractionDispatcherRepository } from '@backend/modules/ai/extraction-dispatcher.repository';
import { RECEIPT_STORAGE } from '@backend/modules/storage/storage.tokens';
import { ReceiptStorageRepository } from '@backend/modules/storage/receipt-storage.repository';
import { UpdateExpenseItemDto } from '@backend/modules/items/dto/update-expense-item.dto';
import {
  AI_STATUS,
  CreateExpenseItemInput,
  ExpenseItemRecord,
  ExpenseItemResponse,
  ReceiptUploadFile,
  REPORT_STATUS,
  ReportStateRecord,
} from '@backend/modules/items/items.types';
import { ExpenseItemsRepository } from '@backend/modules/items/repositories/expense-items.repository';
import { ReportStateRepository } from '@backend/modules/items/repositories/report-state.repository';

@Injectable()
export class ItemsService {
  constructor(
    private readonly expenseItemsRepository: ExpenseItemsRepository,
    private readonly reportStateRepository: ReportStateRepository,
    @Inject(RECEIPT_STORAGE)
    private readonly receiptStorageRepository: ReceiptStorageRepository,
    @Inject(EXTRACTION_DISPATCHER)
    private readonly extractionDispatcherRepository: ExtractionDispatcherRepository,
  ) {}

  async listByReportId(
    reportId: string,
    userId: string,
  ): Promise<{ items: ExpenseItemResponse[] }> {
    await this.fetchAuthorizedReport(reportId, userId);
    const items = await this.expenseItemsRepository.findByReportId(reportId);

    return {
      items: await Promise.all(items.map((item) => this.mapResponse(item))),
    };
  }

  async uploadReceipt(
    reportId: string,
    userId: string,
    file: ReceiptUploadFile | undefined,
    initialData?: Partial<CreateExpenseItemInput>,
  ): Promise<{ item: ExpenseItemResponse }> {
    if (!file) {
      throw new BadRequestException('A receipt file is required.');
    }

    await this.assertReportAllowsMutation(reportId, userId);

    const storedReceipt = await this.receiptStorageRepository.uploadReceipt({
      reportId,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      size: file.size,
    });

    const hasManualData =
      initialData != null &&
      Object.values(initialData).some((v) => v !== undefined && v !== null);

    const item = await this.expenseItemsRepository.create({
      reportId,
      aiStatus: hasManualData ? AI_STATUS.COMPLETED : AI_STATUS.PROCESSING,
      extractionError: null,
      receiptObjectKey: storedReceipt.objectKey,
      receiptOriginalName: storedReceipt.originalName,
      receiptMimeType: storedReceipt.mimeType,
      receiptSize: storedReceipt.size,
      ...initialData,
    });

    if (!hasManualData) {
      await this.extractionDispatcherRepository.dispatch(item.id);
    }

    return {
      item: await this.mapResponse(item),
    };
  }

  async updateItem(
    itemId: string,
    userId: string,
    dto: UpdateExpenseItemDto,
  ): Promise<{ item: ExpenseItemResponse }> {
    if (
      dto.amount === undefined &&
      dto.date === undefined &&
      dto.merchant === undefined &&
      dto.currency === undefined &&
      dto.description === undefined &&
      dto.aiExtracted === undefined
    ) {
      throw new BadRequestException('At least one item field must be provided.');
    }

    const existing = await this.expenseItemsRepository.findById(itemId);

    if (!existing) {
      throw new NotFoundException('Expense item not found.');
    }

    await this.assertReportAllowsMutation(existing.reportId, userId);

    const patch = {
      ...(dto.amount === undefined ? {} : { amount: normalizeAmount(dto.amount) }),
      ...(dto.merchant === undefined ? {} : { merchant: dto.merchant.trim() }),
      ...(dto.date === undefined ? {} : { date: dto.date }),
      ...(dto.currency === undefined ? {} : { currency: dto.currency.trim() }),
      ...(dto.description === undefined ? {} : { description: dto.description?.trim() ?? null }),
      ...(dto.aiExtracted === undefined ? {} : { aiExtracted: dto.aiExtracted }),
    };

    const updated = await this.expenseItemsRepository.update(itemId, patch);

    return {
      item: await this.mapResponse(updated),
    };
  }

  async deleteItem(itemId: string, userId: string): Promise<void> {
    const existing = await this.expenseItemsRepository.findById(itemId);

    if (!existing) {
      throw new NotFoundException('Expense item not found.');
    }

    await this.assertReportAllowsMutation(existing.reportId, userId);
    await this.expenseItemsRepository.delete(itemId);

    if (existing.receiptObjectKey) {
      await this.receiptStorageRepository.deleteReceipt(existing.receiptObjectKey);
    }
  }

  private async fetchAuthorizedReport(
    reportId: string,
    userId: string,
  ): Promise<ReportStateRecord> {
    const report = await this.reportStateRepository.findById(reportId);

    if (!report) {
      throw new NotFoundException('Expense report not found.');
    }

    if (report.userId !== userId) {
      throw new ForbiddenException('You do not have access to this report.');
    }

    return report;
  }

  private async assertReportAllowsMutation(
    reportId: string,
    userId: string,
  ): Promise<ReportStateRecord> {
    const report = await this.fetchAuthorizedReport(reportId, userId);

    if (report.status === REPORT_STATUS.REJECTED) {
      const reopenedReport: ReportStateRecord = {
        ...report,
        status: REPORT_STATUS.DRAFT,
      };

      return this.reportStateRepository.save(reopenedReport);
    }

    if (report.status !== REPORT_STATUS.DRAFT) {
      throw new ConflictException('This report is locked and cannot be edited.');
    }

    return report;
  }

  private async mapResponse(item: ExpenseItemRecord): Promise<ExpenseItemResponse> {
    return {
      ...item,
      receiptUrl: item.receiptObjectKey
        ? await this.receiptStorageRepository.getReceiptUrl(item.receiptObjectKey)
        : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}

function normalizeAmount(amount: string): string {
  const num = Number(amount);
  if (!isFinite(num)) {
    throw new BadRequestException('Invalid amount value.');
  }
  return num.toFixed(2);
}
