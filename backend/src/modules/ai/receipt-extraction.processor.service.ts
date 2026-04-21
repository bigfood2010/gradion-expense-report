import { Inject, Injectable, Logger } from '@nestjs/common';

import { ExpenseItemsRepository } from '@backend/modules/items/repositories/expense-items.repository';
import { AI_STATUS } from '@backend/modules/items/items.types';
import { RECEIPT_STORAGE } from '@backend/modules/storage/storage.tokens';
import { ReceiptStorageRepository } from '@backend/modules/storage/receipt-storage.repository';
import { RECEIPT_EXTRACTOR } from '@backend/modules/ai/ai.tokens';
import { ReceiptExtractorRepository } from '@backend/modules/ai/receipt-extractor.repository';

@Injectable()
export class ReceiptExtractionProcessorService {
  private readonly logger = new Logger(ReceiptExtractionProcessorService.name);

  constructor(
    private readonly expenseItemsRepository: ExpenseItemsRepository,
    @Inject(RECEIPT_STORAGE)
    private readonly receiptStorageRepository: ReceiptStorageRepository,
    @Inject(RECEIPT_EXTRACTOR)
    private readonly receiptExtractorRepository: ReceiptExtractorRepository,
  ) {}

  async process(itemId: string): Promise<void> {
    const item = await this.expenseItemsRepository.findById(itemId);

    if (!item) {
      this.logger.warn(`Item ${itemId} not found — skipping extraction`);
      return;
    }

    if (!item.receiptObjectKey) {
      this.logger.warn(`Item ${itemId} has no receiptObjectKey — marking FAILED`);
      await this.expenseItemsRepository.update(itemId, {
        aiStatus: AI_STATUS.FAILED,
        extractionError: 'No receipt file associated with this item.',
      });
      return;
    }

    try {
      const buffer = await this.receiptStorageRepository.readReceipt(item.receiptObjectKey);

      const extraction = await this.receiptExtractorRepository.extract({
        objectKey: item.receiptObjectKey,
        originalName: item.receiptOriginalName ?? 'receipt',
        mimeType: item.receiptMimeType ?? 'application/octet-stream',
        size: item.receiptSize ?? buffer.length,
        buffer,
      });

      await this.expenseItemsRepository.update(item.id, {
        aiStatus: AI_STATUS.COMPLETED,
        aiExtracted: true,
        amount: normalizeOptionalExtractionValue(extraction.amount),
        merchant: normalizeOptionalExtractionValue(extraction.merchant),
        date: normalizeOptionalExtractionValue(extraction.date),
        currency: normalizeOptionalExtractionValue(extraction.currency),
        description: extraction.description ?? null,
        extractionError: null,
      });
    } catch (error) {
      this.logger.warn(
        `Receipt extraction failed for item ${item.id}: ${
          error instanceof Error ? error.message : 'Unknown extraction error'
        }`,
      );
      await this.expenseItemsRepository.update(item.id, {
        aiStatus: AI_STATUS.FAILED,
        extractionError: 'Receipt extraction failed.',
      });
    }
  }
}

function normalizeOptionalExtractionValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
