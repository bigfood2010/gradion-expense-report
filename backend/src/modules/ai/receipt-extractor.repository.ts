export interface ReceiptExtractionInput {
  objectKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface ReceiptExtractionResult {
  amount: string;
  merchant: string;
  date: string;
  currency: string;
  description: string | null;
}

export abstract class ReceiptExtractorRepository {
  abstract extract(input: ReceiptExtractionInput): Promise<ReceiptExtractionResult>;
}
