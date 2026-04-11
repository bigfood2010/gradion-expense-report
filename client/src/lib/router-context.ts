import type { QueryClient } from '@tanstack/react-query';
import type { ApiClient } from '@client/lib/api-client';
import type { AuthContextValue } from '@client/lib/auth-context';

export interface AppRouterContext {
  auth: AuthContextValue;
  apiClient: ApiClient;
  queryClient: QueryClient;
}
