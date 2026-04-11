import { UploadReceiptInput, StoredReceipt } from './storage.types';

export abstract class ReceiptStorageRepository {
  abstract uploadReceipt(input: UploadReceiptInput): Promise<StoredReceipt>;

  abstract getReceiptUrl(objectKey: string): Promise<string>;

  abstract readReceipt(objectKey: string): Promise<Buffer>;

  abstract deleteReceipt(objectKey: string): Promise<void>;
}
