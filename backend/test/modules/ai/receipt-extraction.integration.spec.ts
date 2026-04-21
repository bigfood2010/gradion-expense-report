import { ReceiptExtractionProcessorService } from '@backend/modules/ai/receipt-extraction.processor.service';
import type { ReceiptExtractorRepository } from '@backend/modules/ai/receipt-extractor.repository';
import type { ExpenseItemsRepository } from '@backend/modules/items/repositories/expense-items.repository';
import type { ReceiptStorageRepository } from '@backend/modules/storage/receipt-storage.repository';
import { AI_STATUS } from '@backend/modules/items/items.types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    receiptObjectKey: 'receipts/report-1/receipt.jpg',
    receiptOriginalName: 'receipt.jpg',
    receiptMimeType: 'image/jpeg',
    receiptSize: 2048,
    ...overrides,
  };
}

function makeService(
  itemData: ReturnType<typeof makeItem> | null,
  extractResult: Record<string, unknown> | Error,
) {
  const expenseItemsRepository = {
    findById: jest.fn().mockResolvedValue(itemData),
    update: jest.fn().mockResolvedValue(undefined),
  } as unknown as ExpenseItemsRepository;

  const receiptStorageRepository = {
    readReceipt: jest.fn().mockResolvedValue(Buffer.from('fake-image-bytes')),
  } as unknown as ReceiptStorageRepository;

  const receiptExtractorRepository = {
    extract:
      extractResult instanceof Error
        ? jest.fn().mockRejectedValue(extractResult)
        : jest.fn().mockResolvedValue(extractResult),
  } as unknown as ReceiptExtractorRepository;

  const service = new ReceiptExtractionProcessorService(
    expenseItemsRepository,
    receiptStorageRepository,
    receiptExtractorRepository,
  );

  return { service, expenseItemsRepository, receiptStorageRepository, receiptExtractorRepository };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReceiptExtractionProcessorService — AI extraction integration', () => {
  it('updates item to COMPLETED with extracted fields on success', async () => {
    const { service, expenseItemsRepository } = makeService(makeItem(), {
      merchant: 'Costa Coffee',
      amount: '5.40',
      currency: 'GBP',
      date: '2026-03-15',
      description: 'Flat white',
    });

    await service.process('item-1');

    expect(expenseItemsRepository.update).toHaveBeenCalledWith('item-1', {
      aiStatus: AI_STATUS.COMPLETED,
      aiExtracted: true,
      amount: '5.40',
      merchant: 'Costa Coffee',
      date: '2026-03-15',
      currency: 'GBP',
      description: 'Flat white',
      extractionError: null,
    });
  });

  it('updates item to FAILED and stores a safe error message when extraction throws', async () => {
    const { service, expenseItemsRepository } = makeService(
      makeItem(),
      new Error('Gemini quota exceeded'),
    );

    await service.process('item-1');

    expect(expenseItemsRepository.update).toHaveBeenCalledWith('item-1', {
      aiStatus: AI_STATUS.FAILED,
      extractionError: 'Receipt extraction failed.',
    });
  });

  it('stores a safe error message for non-Error throws', async () => {
    const { service, expenseItemsRepository } = makeService(
      makeItem(),
      'not an Error object' as any,
    );

    // Force non-Error rejection
    (expenseItemsRepository as any).findById = jest.fn().mockResolvedValue(makeItem());
    const fakeRepo = {
      extract: jest.fn().mockRejectedValue('plain string error'),
    } as unknown as ReceiptExtractorRepository;
    const fakeStorage = {
      readReceipt: jest.fn().mockResolvedValue(Buffer.from('')),
    } as unknown as ReceiptStorageRepository;
    const freshService = new ReceiptExtractionProcessorService(
      expenseItemsRepository,
      fakeStorage,
      fakeRepo,
    );

    await freshService.process('item-1');

    expect(expenseItemsRepository.update).toHaveBeenCalledWith('item-1', {
      aiStatus: AI_STATUS.FAILED,
      extractionError: 'Receipt extraction failed.',
    });
  });

  it('does nothing when item is not found', async () => {
    const { service, expenseItemsRepository } = makeService(null, {});

    await service.process('item-1');

    expect(expenseItemsRepository.update).not.toHaveBeenCalled();
  });

  it('marks item as FAILED when it has no receiptObjectKey', async () => {
    const { service, expenseItemsRepository } = makeService(
      makeItem({ receiptObjectKey: null }),
      {},
    );

    await service.process('item-1');

    expect(expenseItemsRepository.update).toHaveBeenCalledWith('item-1', {
      aiStatus: AI_STATUS.FAILED,
      extractionError: 'No receipt file associated with this item.',
    });
  });

  it('reads receipt bytes from storage before calling extractor', async () => {
    const { service, receiptStorageRepository } = makeService(makeItem(), {
      merchant: 'Test',
      amount: '10.00',
      currency: 'USD',
      date: '2026-01-01',
    });

    await service.process('item-1');

    expect(receiptStorageRepository.readReceipt).toHaveBeenCalledWith(
      'receipts/report-1/receipt.jpg',
    );
  });
});
