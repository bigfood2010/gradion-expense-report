import type {
  CurrencyCode,
  IsoDateString,
  IsoDateTimeString,
  Uuid,
} from '@shared/common/primitives';
import type { AIStatus } from '@shared/enums';

export interface ExpenseItemDto {
  id: Uuid;
  reportId: Uuid;
  merchant: string | null;
  description?: string | null;
  amount: number | null;
  currency: CurrencyCode | null;
  date: IsoDateString | null;
  receiptUrl: string | null;
  receiptOriginalName: string | null;
  aiStatus: AIStatus;
  aiExtracted: boolean;
  extractionError?: string | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface ReceiptExtractionResultDto {
  merchant: string;
  amount: number;
  currency: CurrencyCode;
  date: IsoDateString;
  description?: string | null;
  confidence?: number;
}

export interface ReceiptUploadMetaDto {
  fileName: string;
  mimeType: string;
  fileSize: number;
}
