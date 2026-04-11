import { hasConfiguredAiProviderApiKey } from '@backend/modules/ai/ai-provider-config';

describe('hasConfiguredAiProviderApiKey', () => {
  it.each([undefined, '', '   ', 'replace-me', 'REPLACE_ME', 'your-api-key-here'])(
    'returns false for placeholder or empty value %p',
    (value) => {
      expect(hasConfiguredAiProviderApiKey(value)).toBe(false);
    },
  );

  it('returns true for real-looking api keys', () => {
    expect(hasConfiguredAiProviderApiKey('AIzaSy-real-key')).toBe(true);
  });
});
