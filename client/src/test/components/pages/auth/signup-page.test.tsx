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
      <form data-testid="signup-form" onSubmit={onSubmit}>
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
    login: jest.fn(),
    signup: jest.fn().mockResolvedValue({ user: { id: '1' } }),
    logout: jest.fn(),
    setSession: jest.fn(),
    ...overrides,
  });
}

import { SignupPage } from '@client/components/pages/auth/signup-page';

describe('SignupPage', () => {
  beforeEach(() => {
    mockUnauthenticated();
  });

  it('renders "Create account" title when unauthenticated', () => {
    render(<SignupPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create account');
  });

  it('redirects to "/" when already authenticated', () => {
    mockUnauthenticated({ isAuthenticated: true });
    render(<SignupPage />);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
  });

  it('shows sign in link in footer', () => {
    render(<SignupPage />);
    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  it('calls auth.signup with trimmed email and password on submit', async () => {
    const signup = jest.fn().mockResolvedValue({ user: { id: '1' } });
    mockUnauthenticated({ signup });

    render(<SignupPage />);
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith({ email: '', password: '' });
    });
  });

  it('navigates to "/" after successful signup', async () => {
    const mockNavigate = jest.fn().mockResolvedValue(undefined);
    const reactRouter = require('@tanstack/react-router');
    reactRouter.useNavigate = () => mockNavigate;

    render(<SignupPage />);
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
    });
  });

  it('shows error message when signup throws ApiClientError', async () => {
    const signup = jest
      .fn()
      .mockRejectedValue(new ApiClientError('Email already in use', { status: 422 }));
    mockUnauthenticated({ signup });

    render(<SignupPage />);
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email already in use');
    });
  });

  it('shows generic error when signup throws unknown error', async () => {
    const signup = jest.fn().mockRejectedValue('unexpected');
    mockUnauthenticated({ signup });

    render(<SignupPage />);
    fireEvent.submit(screen.getByTestId('signup-form'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Try again.');
    });
  });

  it('clears error on new submit attempt', async () => {
    let callCount = 0;
    const signup = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new ApiClientError('Email already in use', { status: 422 }));
      }
      return Promise.resolve({ user: { id: '1' } });
    });
    mockUnauthenticated({ signup });

    render(<SignupPage />);

    fireEvent.submit(screen.getByTestId('signup-form'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    fireEvent.submit(screen.getByTestId('signup-form'));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
