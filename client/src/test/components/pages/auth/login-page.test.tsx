import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiClientError } from '@client/lib/api-client';
import { useAuth } from '@client/lib/auth-context';
import type { AuthContextValue } from '@client/lib/auth-context';

jest.mock('@client/lib/auth-context');

jest.mock('@tanstack/react-router', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useNavigate: () => jest.fn().mockResolvedValue(undefined),
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

jest.mock('@client/components/pages/auth/auth-page', () => ({
  AuthPage: ({ onSubmit, title, error, loading, footer }: any) => (
    <div>
      <h1>{title}</h1>
      {footer}
      {error && <p role="alert">{error}</p>}
      <form data-testid="login-form" onSubmit={onSubmit}>
        <button type="submit" disabled={loading}>
          Submit
        </button>
      </form>
    </div>
  ),
}));

const mockUseAuth = useAuth as jest.Mock;

function mockUnauthenticated(overrides?: Partial<AuthContextValue>) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    session: null,
    login: jest.fn().mockResolvedValue({ user: { id: '1' } }),
    signup: jest.fn(),
    logout: jest.fn(),
    setSession: jest.fn(),
    ...overrides,
  });
}

import { LoginPage } from '@client/components/pages/auth/login-page';

describe('LoginPage', () => {
  beforeEach(() => {
    mockUnauthenticated();
  });

  it('renders sign in title when unauthenticated', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign in');
  });

  it('redirects to "/" when already authenticated', () => {
    mockUnauthenticated({ isAuthenticated: true });
    render(<LoginPage />);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
  });

  it('shows demo credentials in footer', () => {
    render(<LoginPage />);
    expect(screen.getByText('Demo credentials')).toBeInTheDocument();
    expect(screen.getByText(/user@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/admin@example\.com/)).toBeInTheDocument();
  });

  it('shows sign up link in footer', () => {
    render(<LoginPage />);
    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/signup');
  });

  it('calls auth.login with trimmed email and password on submit', async () => {
    const login = jest.fn().mockResolvedValue({ user: { id: '1' } });
    mockUnauthenticated({ login });

    render(<LoginPage />);
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: '', password: '' });
    });
  });

  it('navigates to "/" after successful login', async () => {
    const mockNavigate = jest.fn().mockResolvedValue(undefined);
    const reactRouter = require('@tanstack/react-router');
    reactRouter.useNavigate = () => mockNavigate;

    render(<LoginPage />);
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
    });
  });

  it('shows error message when login throws ApiClientError', async () => {
    const login = jest
      .fn()
      .mockRejectedValue(new ApiClientError('Invalid credentials', { status: 401 }));
    mockUnauthenticated({ login });

    render(<LoginPage />);
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('shows generic error when login throws unknown error', async () => {
    const login = jest.fn().mockRejectedValue('unexpected');
    mockUnauthenticated({ login });

    render(<LoginPage />);
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Try again.');
    });
  });

  it('clears error on new submit attempt', async () => {
    let callCount = 0;
    const login = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new ApiClientError('Bad credentials', { status: 401 }));
      }
      return Promise.resolve({ user: { id: '1' } });
    });
    mockUnauthenticated({ login });

    render(<LoginPage />);

    fireEvent.submit(screen.getByTestId('login-form'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    fireEvent.submit(screen.getByTestId('login-form'));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
