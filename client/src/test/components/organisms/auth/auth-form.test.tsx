import React from 'react';
import { render, screen } from '@testing-library/react';

import { AuthForm } from '@client/components/organisms/auth/auth-form';

jest.mock('framer-motion', () => ({
  motion: {
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

describe('AuthForm', () => {
  it('does not render a name field in signup mode', () => {
    render(
      <AuthForm
        error={null}
        loading={false}
        mode="signup"
        onFieldChange={jest.fn()}
        onSubmit={jest.fn()}
        values={{ email: '', password: '' }}
      />,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
  });
});
