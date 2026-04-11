export interface StoredReceipt {
  objectKey: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface UploadReceiptInput {
  reportId: string;
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  size: number;
}
