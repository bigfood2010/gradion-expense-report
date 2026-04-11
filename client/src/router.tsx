import { createRouter } from '@tanstack/react-router';
import { Button } from '@client/components/atoms/button';
import { EmptyState } from '@client/components/molecules/empty-state';
import { apiClient } from '@client/lib/api-client';
import { queryClient } from '@client/lib/query-client';
import { routeTree } from './routeTree.gen';

function DefaultErrorComponent({
  error,
  reset,
}: {
  readonly error: Error;
  readonly reset: () => void;
}) {
  return (
    <div className="route-state">
      <EmptyState
        title="Something Went Wrong"
        description={error.message || 'The client hit an unexpected error. Try the action again.'}
        action={<Button onClick={reset}>Try Again</Button>}
      />
    </div>
  );
}

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    apiClient,
    queryClient,
  },
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: DefaultErrorComponent,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
