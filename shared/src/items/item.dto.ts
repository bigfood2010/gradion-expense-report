import type {
  AmountRangeQueryDto,
  DateRangeQueryDto,
  PaginatedApiResponseDto,
  PaginationQueryDto,
  TextSearchQueryDto,
} from '@shared/common';
import type { CurrencyCode, IsoDateString, Uuid } from '@shared/common/primitives';
import type { AIStatus } from '@shared/enums';
import type { ExpenseItemDto } from '@shared/items/item.types';

export interface CreateExpenseItemRequestDto {
  reportId: Uuid;
  merchant?: string;
  description?: string | null;
  amount?: string;
  currency?: CurrencyCode;
  date?: IsoDateString;
  receiptUrl?: string | null;
  aiStatus?: AIStatus;
  aiExtracted?: boolean;
}

export interface UpdateExpenseItemRequestDto {
  merchant?: string;
  description?: string | null;
  amount?: string;
  currency?: CurrencyCode;
  date?: IsoDateString;
  receiptUrl?: string | null;
  aiStatus?: AIStatus;
  aiExtracted?: boolean;
}

export interface ExpenseItemQueryDto
  extends PaginationQueryDto, TextSearchQueryDto, DateRangeQueryDto, AmountRangeQueryDto {
  reportId?: Uuid;
  aiStatus?: AIStatus;
  currency?: CurrencyCode;
}

export interface UploadReceiptRequestDto {
  reportId: Uuid;
}

export type PaginatedExpenseItemResponseDto = PaginatedApiResponseDto<ExpenseItemDto>;
