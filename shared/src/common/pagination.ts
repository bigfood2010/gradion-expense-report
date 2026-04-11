import type { ApiResponseDto } from '@shared/common/api-response';

export type SortOrder = 'asc' | 'desc';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationQueryDto {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginationMetaDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponseDto<TItem> {
  items: TItem[];
  meta: PaginationMetaDto;
}

export type PaginatedApiResponseDto<TItem> = ApiResponseDto<PaginatedResponseDto<TItem>>;

export interface PaginationWindow {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function normalizePagination(
  query?: PaginationQueryDto,
  options: {
    defaultPageSize?: number;
    maxPageSize?: number;
  } = {},
): PaginationWindow {
  const page = normalizePage(query?.page);
  const pageSize = clampPageSize(query?.pageSize, {
    defaultPageSize: options.defaultPageSize ?? DEFAULT_PAGE_SIZE,
    maxPageSize: options.maxPageSize ?? MAX_PAGE_SIZE,
  });

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function normalizePage(page?: number): number {
  if (!Number.isFinite(page)) {
    return DEFAULT_PAGE;
  }

  return Math.max(DEFAULT_PAGE, Math.trunc(page ?? DEFAULT_PAGE));
}

export function clampPageSize(
  pageSize?: number,
  options: {
    defaultPageSize?: number;
    maxPageSize?: number;
  } = {},
): number {
  const defaultPageSize = options.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = options.maxPageSize ?? MAX_PAGE_SIZE;

  if (!Number.isFinite(pageSize)) {
    return defaultPageSize;
  }

  const normalizedPageSize = Math.max(1, Math.trunc(pageSize ?? defaultPageSize));
  return Math.min(normalizedPageSize, maxPageSize);
}

export function createPaginationMeta(
  totalItems: number,
  page: number,
  pageSize: number,
): PaginationMetaDto {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(page, 1), totalPages);

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1 && totalPages > 0,
  };
}
