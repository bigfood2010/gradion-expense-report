import ReactDOM from 'react-dom/client';
import { StrictMode, useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@client/lib/providers';
import { ErrorBoundary } from '@client/components/error-boundary';
import { apiClient } from '@client/lib/api-client';
import { useAuth } from '@client/lib/auth-context';
import { queryClient } from '@client/lib/query-client';
import { router } from '@client/router';
import '@client/styles/index.css';

function RoutedApp() {
  const auth = useAuth();

  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => {
      auth.logout();
      void router.navigate({ to: '/login', replace: true });
    });
    return () => apiClient.setUnauthorizedHandler(undefined);
  }, [auth]);

  return (
    <RouterProvider
      router={router}
      context={{
        auth,
        apiClient,
        queryClient,
      }}
    />
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <RoutedApp />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);
