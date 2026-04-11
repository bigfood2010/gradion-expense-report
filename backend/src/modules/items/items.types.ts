import { ExpenseItemAIStatus, ExpenseReportStatus } from '@backend/modules/reports/reports.types';

export const REPORT_STATUS = ExpenseReportStatus;
export const AI_STATUS = ExpenseItemAIStatus;

export interface ExpenseItemRecord {
  id: string;
  reportId: string;
  amount: string | null;
  merchant: string | null;
  description: string | null;
  currency: string | null;
  date: string | null;
  aiStatus: ExpenseItemAIStatus;
  aiExtracted: boolean;
  extractionError: string | null;
  receiptObjectKey: string | null;
  receiptOriginalName: string | null;
  receiptMimeType: string | null;
  receiptSize: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseItemInput {
  reportId: string;
  amount?: string | null;
  merchant?: string | null;
  description?: string | null;
  currency?: string | null;
  date?: string | null;
  aiStatus: ExpenseItemAIStatus;
  extractionError?: string | null;
  receiptObjectKey?: string | null;
  receiptOriginalName?: string | null;
  receiptMimeType?: string | null;
  receiptSize?: number | null;
  aiExtracted?: boolean;
}

export interface UpdateExpenseItemInput {
  amount?: string | null;
  merchant?: string | null;
  description?: string | null;
  currency?: string | null;
  date?: string | null;
  aiStatus?: ExpenseItemAIStatus;
  extractionError?: string | null;
  aiExtracted?: boolean;
}

export interface ReportStateRecord {
  id: string;
  userId: string;
  status: ExpenseReportStatus;
}

export interface ReceiptUploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface ExpenseItemResponse extends Omit<ExpenseItemRecord, 'createdAt' | 'updatedAt'> {
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
