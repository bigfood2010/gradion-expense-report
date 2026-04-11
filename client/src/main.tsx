import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@client/lib/providers';
import { apiClient } from '@client/lib/api-client';
import { useAuth } from '@client/lib/auth-context';
import { queryClient } from '@client/lib/query-client';
import { router } from '@client/router';
import '@client/styles/index.css';

function RoutedApp() {
  const auth = useAuth();

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
    <AppProviders>
      <RoutedApp />
    </AppProviders>
  </StrictMode>,
);
