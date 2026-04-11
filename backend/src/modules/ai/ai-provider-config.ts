const PLACEHOLDER_API_KEYS = new Set([
  'replace-me',
  'replace_me',
  'change-me',
  'change_me',
  'changeme',
  'your-api-key-here',
]);

export function hasConfiguredAiProviderApiKey(apiKey?: string | null): boolean {
  const normalized = apiKey?.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_API_KEYS.has(normalized);
}
