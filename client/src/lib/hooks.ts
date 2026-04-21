import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { ExpenseItemDto, UpdateExpenseItemRequestDto } from '@gradion/shared/items';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@gradion/shared/common';
import type {
  CreateExpenseReportRequestDto,
  ExpenseReportAdminListResponseDto,
  ExpenseReportCursorResponseDto,
  ExpenseReportDashboardSummaryDto,
  ExpenseReportDetailResponseDto,
  ExpenseReportListResponseDto,
  UpdateExpenseReportRequestDto,
} from '@gradion/shared/reports';

import type { ApiClientError } from '@client/lib/api-client';
import { apiClient } from '@client/lib/api-client';
import { useAuth } from '@client/lib/auth-context';
import { queryKeys } from '@client/lib/query-keys';

export interface ListResponse<TItem> {
  items: TItem[];
}

export interface UploadReceiptInput {
  receipt: File;
}

export interface UpdateExpenseItemInput {
  itemId: string;
  payload: UpdateExpenseItemRequestDto;
}

export interface DeleteExpenseItemInput {
  itemId: string;
}

export interface CreateExpenseReportInput {
  payload: CreateExpenseReportRequestDto;
}

export interface UpdateExpenseReportInput {
  reportId: string;
  payload: UpdateExpenseReportRequestDto;
}

async function invalidateReportScopes(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
  ]);
}

export function useAuthSession() {
  const auth = useAuth();

  return {
    session: auth.session,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    signIn: auth.login,
    signUp: auth.signup,
    signOut: auth.logout,
    setSession: auth.setSession,
  };
}

export function useExpenseReportsQuery(scope: string, page: number = DEFAULT_PAGE, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports.list(scope, page, DEFAULT_PAGE_SIZE),
    queryFn: async () =>
      apiClient.reports.list({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
      }) as Promise<ExpenseReportListResponseDto>,
    enabled,
    placeholderData: keepPreviousData,
  });
}

const DEFAULT_CURSOR_LIMIT = 50;

export function useExpenseReportsInfiniteQuery(scope: string, status?: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.reports.infinite(scope, status),
    queryFn: async ({ pageParam }: { pageParam: string | null }) =>
      apiClient.reports.listCursor(
        pageParam ?? undefined,
        DEFAULT_CURSOR_LIMIT,
        status,
      ) as Promise<ExpenseReportCursorResponseDto>,
    initialPageParam: null,
    getNextPageParam: (lastPage: ExpenseReportCursorResponseDto) => lastPage.nextCursor,
    enabled,
  });
}

export function useExpenseReportSummaryQuery(scope: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports.summary(scope),
    queryFn: async () => apiClient.reports.summary() as Promise<ExpenseReportDashboardSummaryDto>,
    enabled,
  });
}

export function useExpenseReportDetailQuery(reportId: string) {
  return useQuery({
    queryKey: queryKeys.reports.detail(reportId),
    queryFn: async () => apiClient.reports.detail(reportId),
    enabled: Boolean(reportId),
  });
}

export function useCreateExpenseReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload }: CreateExpenseReportInput) =>
      apiClient.reports.create(payload) as Promise<ExpenseReportDetailResponseDto>,
    onSuccess: async () => {
      await invalidateReportScopes(queryClient);
    },
  });
}

export function useUpdateExpenseReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, payload }: UpdateExpenseReportInput) =>
      apiClient.reports.update(reportId, payload) as Promise<ExpenseReportDetailResponseDto>,
    onSuccess: async () => {
      await invalidateReportScopes(queryClient);
    },
  });
}

export function useExpenseReportItemsQuery(
  reportId: string,
  options?: Omit<
    UseQueryOptions<ListResponse<ExpenseItemDto>, ApiClientError, ListResponse<ExpenseItemDto>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.reports.items(reportId),
    queryFn: async () => apiClient.items.list(reportId) as Promise<ListResponse<ExpenseItemDto>>,
    enabled: Boolean(reportId),
    ...options,
  });
}

export function useAdminExpenseReportsQuery(page: number = DEFAULT_PAGE, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.reports(page, DEFAULT_PAGE_SIZE),
    queryFn: async () =>
      apiClient.admin.reports({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
      }) as Promise<ExpenseReportAdminListResponseDto>,
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useSubmitExpenseReportMutation(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => apiClient.reports.submit(reportId),
    onSuccess: async () => {
      await invalidateReportScopes(queryClient);
    },
  });
}

export function useUploadExpenseItemMutation(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receipt }: UploadReceiptInput) => {
      const formData = new FormData();
      formData.append('receipt', receipt);

      return apiClient.items.create(reportId, formData) as Promise<{
        item: ExpenseItemDto & { extractionError?: string | null };
      }>;
    },
    onSuccess: async () => {
      await invalidateReportScopes(queryClient);
    },
  });
}

export function useUpdateExpenseItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, payload }: UpdateExpenseItemInput) =>
      apiClient.items.update(itemId, payload) as Promise<{
        item: ExpenseItemDto & { extractionError?: string | null };
      }>,
    onSuccess: async () => {
      await invalidateReportScopes(queryClient);
    },
  });
}

export function useDeleteExpenseItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId }: DeleteExpenseItemInput) => {
      await apiClient.items.remove(itemId);
      return itemId;
    },
    onSuccess: async () => {
      await invalidateReportScopes(queryClient);
    },
  });
}

export function useApproveExpenseReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId }: { reportId: string }) => apiClient.admin.approve(reportId),
    onSuccess: async () => {
      await invalidateReportScopes(queryClient);
    },
  });
}

export function useRejectExpenseReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId }: { reportId: string }) => apiClient.admin.reject(reportId),
    onSuccess: async () => {
      await invalidateReportScopes(queryClient);
    },
  });
}
