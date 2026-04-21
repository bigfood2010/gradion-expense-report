import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@gradion/shared/common';

export const queryKeys = {
  auth: ['auth'] as const,
  reports: {
    all: ['reports'] as const,
    list: (scope: string, page?: number, pageSize?: number) =>
      page !== undefined
        ? (['reports', 'list', scope, page, pageSize] as const)
        : (['reports', 'list', scope] as const),
    infinite: (scope: string, status?: string) => ['reports', 'infinite', scope, status] as const,
    summary: (scope: string) => ['reports', 'summary', scope] as const,
    detail: (reportId: string) => ['reports', 'detail', reportId] as const,
    items: (reportId: string) => ['reports', 'items', reportId] as const,
  },
  admin: {
    all: ['admin'] as const,
    reports: (page: number = DEFAULT_PAGE, pageSize: number = DEFAULT_PAGE_SIZE) =>
      ['admin', 'reports', page, pageSize] as const,
    infinite: (status?: string) => ['admin', 'infinite', status] as const,
  },
};
