import { ApiClientError } from '@client/lib/api-client';
import { getAuthErrorMessage } from '@client/components/pages/auth/auth-error-message';

describe('getAuthErrorMessage', () => {
  it('returns ApiClientError.message when passed an ApiClientError', () => {
    const error = new ApiClientError('Invalid credentials', { status: 401 });
    expect(getAuthErrorMessage(error)).toBe('Invalid credentials');
  });

  it('returns Error.message when passed a generic Error', () => {
    const error = new Error('Network failure');
    expect(getAuthErrorMessage(error)).toBe('Network failure');
  });

  it('returns fallback string for null', () => {
    expect(getAuthErrorMessage(null)).toBe('Something went wrong. Try again.');
  });

  it('returns fallback string for undefined', () => {
    expect(getAuthErrorMessage(undefined)).toBe('Something went wrong. Try again.');
  });

  it('returns fallback string for a plain object', () => {
    expect(getAuthErrorMessage({ code: 500 })).toBe('Something went wrong. Try again.');
  });
});
