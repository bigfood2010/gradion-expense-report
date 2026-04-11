import type { IsoDateString } from '@shared/common/primitives';

export interface TextSearchQueryDto {
  search?: string;
}

export interface DateRangeQueryDto {
  from?: IsoDateString;
  to?: IsoDateString;
}

export interface AmountRangeQueryDto {
  minAmount?: number;
  maxAmount?: number;
}
