export interface ApiResponseMetaDto {
  requestId?: string;
  timestamp?: string;
}

export interface ApiResponseDto<TData> {
  success: true;
  data: TData;
  message?: string;
  meta?: ApiResponseMetaDto;
}

export interface ApiErrorDto {
  code: string;
  message: string;
  details?: Record<string, unknown> | readonly string[];
}

export interface ApiErrorResponseDto {
  success: false;
  error: ApiErrorDto;
  meta?: ApiResponseMetaDto;
}

export type ApiEnvelopeDto<TData> = ApiResponseDto<TData> | ApiErrorResponseDto;
