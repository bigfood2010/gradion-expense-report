import { ReceiptExtractionProcessorService } from '@backend/modules/ai/receipt-extraction.processor.service';
import type { ReceiptExtractorRepository } from '@backend/modules/ai/receipt-extractor.repository';
import type { ExpenseItemsRepository } from '@backend/modules/items/repositories/expense-items.repository';
import type { ReceiptStorageRepository } from '@backend/modules/storage/receipt-storage.repository';
import { AI_STATUS } from '@backend/modules/items/items.types';

describe('ReceiptExtractionProcessorService', () => {
  it('persists null for blank merchant and date instead of failing the extraction', async () => {
    const expenseItemsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'item-1',
        receiptObjectKey: 'receipts/item-1.png',
        receiptOriginalName: 'receipt.png',
        receiptMimeType: 'image/png',
        receiptSize: 123,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as ExpenseItemsRepository;

    const receiptStorageRepository = {
      readReceipt: jest.fn().mockResolvedValue(Buffer.from('fake-image')),
    } as unknown as ReceiptStorageRepository;

    const receiptExtractorRepository = {
      extract: jest.fn().mockResolvedValue({
        merchant: '',
        amount: '38.02',
        currency: 'USD',
        date: '',
        description: null,
      }),
    } as unknown as ReceiptExtractorRepository;

    const service = new ReceiptExtractionProcessorService(
      expenseItemsRepository,
      receiptStorageRepository,
      receiptExtractorRepository,
    );

    await service.process('item-1');

    expect(expenseItemsRepository.update).toHaveBeenCalledWith('item-1', {
      aiStatus: AI_STATUS.COMPLETED,
      aiExtracted: true,
      amount: '38.02',
      merchant: null,
      date: null,
      currency: 'USD',
      description: null,
      extractionError: null,
    });
  });
});
