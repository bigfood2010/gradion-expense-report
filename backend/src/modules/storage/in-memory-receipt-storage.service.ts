import { Injectable } from '@nestjs/common';

import { ReceiptStorageRepository } from './receipt-storage.repository';
import { StoredReceipt, UploadReceiptInput } from './storage.types';
import { sanitizeFileName } from './storage.utils';

@Injectable()
export class InMemoryReceiptStorageService extends ReceiptStorageRepository {
  private readonly objects = new Map<string, Buffer>();
  private readonly metadata = new Map<string, StoredReceipt>();

  async uploadReceipt(input: UploadReceiptInput): Promise<StoredReceipt> {
    const objectKey = `reports/${input.reportId}/${sanitizeFileName(input.originalName)}`;
    const storedReceipt: StoredReceipt = {
      objectKey,
      size: input.size,
      mimeType: input.mimeType,
      originalName: input.originalName,
    };

    this.objects.set(objectKey, Buffer.from(input.buffer));
    this.metadata.set(objectKey, storedReceipt);

    return storedReceipt;
  }

  async getReceiptUrl(objectKey: string): Promise<string> {
    return `in-memory://${objectKey}`;
  }

  async readReceipt(objectKey: string): Promise<Buffer> {
    const file = this.objects.get(objectKey);

    if (!file) {
      throw new Error(`Missing in-memory receipt for ${objectKey}`);
    }

    return Buffer.from(file);
  }

  async deleteReceipt(objectKey: string): Promise<void> {
    this.objects.delete(objectKey);
    this.metadata.delete(objectKey);
  }
}
