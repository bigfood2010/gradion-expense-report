import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@client/components/error-boundary';

// ---------------------------------------------------------------------------
// Helper — component that throws on demand
// ---------------------------------------------------------------------------

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <div data-testid="child">OK</div>;
}

// Module-level flag used by ControlledThrower to simulate recovery
let throwOnRender = true;

function ControlledThrower() {
  if (throwOnRender) throw new Error('controlled error');
  return <div data-testid="recovered-child">Recovered</div>;
}

// Suppress expected console.error noise from ErrorBoundary
beforeEach(() => {
  throwOnRender = true;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test render error')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom error</div>}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('recovers and renders children after "Try again" is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ErrorBoundary>
        <ControlledThrower />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Allow children to render on the next pass
    throwOnRender = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByTestId('recovered-child')).toBeInTheDocument();
  });
});
