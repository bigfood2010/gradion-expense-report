import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthPage } from '@client/components/pages/auth/auth-page';

jest.mock('@client/components/templates/auth-template', () => ({
  AuthTemplate: ({ title, description, footer, children }: any) => (
    <div data-testid="auth-template">
      <h1>{title}</h1>
      <p>{description}</p>
      <div data-testid="footer">{footer}</div>
      <div data-testid="children">{children}</div>
    </div>
  ),
}));

jest.mock('@client/components/organisms/auth/auth-form', () => ({
  AuthForm: ({ mode, loading, error, onSubmit }: any) => (
    <form
      data-testid="auth-form"
      data-mode={mode}
      data-loading={String(loading)}
      onSubmit={onSubmit}
    >
      {error && <p role="alert">{error}</p>}
      <button type="submit">Submit</button>
    </form>
  ),
}));

const BASE_PROPS = {
  mode: 'login' as const,
  title: 'Sign in',
  description: 'Enter your credentials',
  footer: <span data-testid="footer-content">footer text</span>,
  loading: false,
  error: null,
  values: { email: '', password: '' },
  onSubmit: jest.fn(),
  onFieldChange: jest.fn(),
};

describe('AuthPage', () => {
  it('renders title and description from props', () => {
    render(<AuthPage {...BASE_PROPS} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign in');
    expect(screen.getByText('Enter your credentials')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<AuthPage {...BASE_PROPS} />);
    expect(screen.getByTestId('footer-content')).toBeInTheDocument();
  });

  it('renders AuthForm with correct mode prop', () => {
    render(<AuthPage {...BASE_PROPS} mode="signup" />);
    expect(screen.getByTestId('auth-form')).toHaveAttribute('data-mode', 'signup');
  });

  it('passes error to AuthForm which shows it', () => {
    render(<AuthPage {...BASE_PROPS} error="Bad credentials" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Bad credentials');
  });

  it('passes loading=true to AuthForm', () => {
    render(<AuthPage {...BASE_PROPS} loading={true} />);
    expect(screen.getByTestId('auth-form')).toHaveAttribute('data-loading', 'true');
  });

  it('calls onSubmit when form submitted', () => {
    const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
    render(<AuthPage {...BASE_PROPS} onSubmit={onSubmit} />);
    fireEvent.submit(screen.getByTestId('auth-form'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
