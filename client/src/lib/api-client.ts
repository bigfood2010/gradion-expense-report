import type { AuthResponseDto, LoginRequestDto, SignupRequestDto } from '@gradion/shared/auth';
import type { ApiEnvelopeDto, PaginationQueryDto } from '@gradion/shared/common';
import type {
  CreateExpenseItemRequestDto,
  ExpenseItemDto,
  UpdateExpenseItemRequestDto,
} from '@gradion/shared/items';
import type {
  CreateExpenseReportRequestDto,
  ExpenseReportAdminListResponseDto,
  ExpenseReportDashboardSummaryDto,
  ExpenseReportDetailResponseDto,
  ExpenseReportListResponseDto,
  SubmitExpenseReportRequestDto,
  UpdateExpenseReportRequestDto,
} from '@gradion/shared/reports';
import { env } from '@client/lib/env';

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type Primitive = string | number | boolean;
type QueryValue = Primitive | null | undefined;
type QueryRecord = Record<string, QueryValue>;

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, unknown> | readonly string[];

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      details?: Record<string, unknown> | readonly string[];
    },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

interface RequestOptions<TBody> {
  method?: RequestMethod;
  body?: TBody;
  query?: QueryRecord;
  signal?: AbortSignal;
}

function toSearchParams(query?: QueryRecord): string {
  if (!query) {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const encoded = searchParams.toString();
  return encoded ? `?${encoded}` : '';
}

function unwrapEnvelope<TData>(payload: ApiEnvelopeDto<TData> | TData, status: number): TData {
  if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
    throw new ApiClientError(payload.error.message, {
      status,
      code: payload.error.code,
      details: payload.error.details,
    });
  }

  if (payload && typeof payload === 'object' && 'success' in payload && payload.success === true) {
    return payload.data;
  }

  return payload as TData;
}

/** Paths that must never trigger the unauthorized handler to avoid infinite loops or false logouts. */
const UNAUTHENTICATED_PATHS = ['/auth/login', '/auth/signup', '/auth/logout'];

export class ApiClient {
  private unauthorizedHandler?: () => void;
  /** Prevents multiple concurrent 401s from triggering logout/redirect more than once. */
  private handlingUnauthorized = false;

  constructor(private readonly baseUrl: string) {}

  setUnauthorizedHandler(fn: (() => void) | undefined): void {
    this.unauthorizedHandler = fn;
    this.handlingUnauthorized = false;
  }

  async request<TResponse, TBody = undefined>(
    path: string,
    options: RequestOptions<TBody> = {},
  ): Promise<TResponse> {
    const { body, method = 'GET', query, signal: callerSignal } = options;
    const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 30_000);

    const signal = callerSignal
      ? AbortSignal.any([callerSignal, timeoutController.signal])
      : timeoutController.signal;

    try {
    const response = await fetch(`${this.baseUrl}${path}${toSearchParams(query)}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(isMultipart
          ? {}
          : body
            ? {
                'Content-Type': 'application/json',
              }
            : {}),
      },
      body: !body ? undefined : isMultipart ? (body as FormData) : JSON.stringify(body),
      credentials: 'include',
      signal,
    });

    const payload = response.headers.get('content-type')?.includes('application/json')
      ? ((await response.json()) as ApiEnvelopeDto<TResponse> | TResponse)
      : (undefined as TResponse | undefined);

    if (!response.ok) {
      if (
        response.status === 401 &&
        !UNAUTHENTICATED_PATHS.some((p) => path.startsWith(p)) &&
        !this.handlingUnauthorized
      ) {
        this.handlingUnauthorized = true;
        this.unauthorizedHandler?.();
      }

      if (
        payload &&
        typeof payload === 'object' &&
        'success' in payload &&
        payload.success === false
      ) {
        throw new ApiClientError(payload.error.message, {
          status: response.status,
          code: payload.error.code,
          details: payload.error.details,
        });
      }

      throw new ApiClientError(response.statusText || 'Request failed', {
        status: response.status,
      });
    }

    return unwrapEnvelope(payload as ApiEnvelopeDto<TResponse> | TResponse, response.status);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  readonly auth = {
    login: (payload: LoginRequestDto) =>
      this.request<AuthResponseDto, LoginRequestDto>('/auth/login', {
        method: 'POST',
        body: payload,
      }),
    signup: (payload: SignupRequestDto) =>
      this.request<AuthResponseDto, SignupRequestDto>('/auth/signup', {
        method: 'POST',
        body: payload,
      }),
    logout: () =>
      this.request<void>('/auth/logout', {
        method: 'POST',
      }),
  };

  readonly reports = {
    list: (query?: PaginationQueryDto & QueryRecord) =>
      this.request<ExpenseReportListResponseDto>('/reports', {
        method: 'GET',
        query,
      }),
    summary: () =>
      this.request<ExpenseReportDashboardSummaryDto>('/reports/summary', {
        method: 'GET',
      }),
    detail: (reportId: string) =>
      this.request<ExpenseReportDetailResponseDto>(`/reports/${reportId}`),
    create: (payload: CreateExpenseReportRequestDto) =>
      this.request<ExpenseReportDetailResponseDto, CreateExpenseReportRequestDto>('/reports', {
        method: 'POST',
        body: payload,
      }),
    update: (reportId: string, payload: UpdateExpenseReportRequestDto) =>
      this.request<ExpenseReportDetailResponseDto, UpdateExpenseReportRequestDto>(
        `/reports/${reportId}`,
        {
          method: 'PATCH',
          body: payload,
        },
      ),
    submit: (reportId: string, payload: SubmitExpenseReportRequestDto = {}) =>
      this.request<ExpenseReportDetailResponseDto, SubmitExpenseReportRequestDto>(
        `/reports/${reportId}/submit`,
        {
          method: 'PATCH',
          body: payload,
        },
      ),
  };

  readonly items = {
    list: (reportId: string) =>
      this.request<{ items: ExpenseItemDto[] }>(`/reports/${reportId}/items`),
    create: (reportId: string, payload: CreateExpenseItemRequestDto | FormData) =>
      this.request(`/reports/${reportId}/items`, {
        method: 'POST',
        body: payload,
      }),
    update: (itemId: string, payload: UpdateExpenseItemRequestDto) =>
      this.request(`/items/${itemId}`, {
        method: 'PATCH',
        body: payload,
      }),
    remove: (itemId: string) =>
      this.request(`/items/${itemId}`, {
        method: 'DELETE',
      }),
  };

  readonly admin = {
    reports: (query?: PaginationQueryDto & QueryRecord) =>
      this.request<ExpenseReportAdminListResponseDto>('/admin/reports', {
        method: 'GET',
        query,
      }),
    approve: (reportId: string) =>
      this.request<ExpenseReportDetailResponseDto>(`/admin/reports/${reportId}/approve`, {
        method: 'PATCH',
      }),
    reject: (reportId: string) =>
      this.request<ExpenseReportDetailResponseDto>(`/admin/reports/${reportId}/reject`, {
        method: 'PATCH',
      }),
  };
}

export const apiClient = new ApiClient(env.apiBaseUrl);
