import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';

import { AuthProvider, useAuth } from '@client/lib/auth-context';

jest.mock('@client/lib/api-client', () => ({
  apiClient: {
    auth: {
      login: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
      signup: jest.fn(),
    },
  },
}));

function LogoutButton() {
  const auth = useAuth();
  return <button onClick={auth.logout}>Log out</button>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('clears cached server data on logout', async () => {
    window.localStorage.setItem(
      'gradion.auth.session',
      JSON.stringify({
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'user@example.com',
          role: 'user',
        },
      }),
    );
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    queryClient.setQueryData(['reports', 'detail', 'report-1'], { id: 'report-1' });

    function Wrapper({ children }: PropsWithChildren) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>,
      { wrapper: Wrapper },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(window.localStorage.getItem('gradion.auth.session')).toBeNull();
    expect(queryClient.getQueryData(['reports', 'detail', 'report-1'])).toBeUndefined();
  });
});
