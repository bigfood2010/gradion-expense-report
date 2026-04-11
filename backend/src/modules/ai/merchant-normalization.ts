const GENERIC_MERCHANT_VALUES = new Set([
  'receipt',
  'receipt png',
  'receipt jpg',
  'receipt jpeg',
  'receipt image',
  'image',
  'photo',
  'screenshot',
  'scan',
]);

export function normalizeExtractedMerchant(
  merchant: unknown,
  originalName: string,
): string {
  if (typeof merchant !== 'string') {
    return '';
  }

  const normalized = merchant.trim();

  if (!normalized) {
    return '';
  }

  const canonicalMerchant = canonicalize(normalized);
  const canonicalOriginalName = canonicalize(stripExtension(originalName));
  const opaqueOriginalName = isOpaqueFilename(canonicalOriginalName);

  if (
    !canonicalMerchant ||
    (opaqueOriginalName &&
      (canonicalMerchant === canonicalOriginalName ||
        canonicalMerchant.startsWith(canonicalOriginalName) ||
        canonicalOriginalName.startsWith(canonicalMerchant))) ||
    GENERIC_MERCHANT_VALUES.has(canonicalMerchant) ||
    /^img\d+$/.test(canonicalMerchant) ||
    /^image\d+$/.test(canonicalMerchant) ||
    /^\d+$/.test(canonicalMerchant)
  ) {
    return '';
  }

  return normalized;
}

function stripExtension(value: string): string {
  return value.replace(/\.[^.]+$/, '');
}

function canonicalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '');
}

function isOpaqueFilename(value: string): boolean {
  return (
    !value ||
    GENERIC_MERCHANT_VALUES.has(value) ||
    /^img\d+$/.test(value) ||
    /^image\d+$/.test(value) ||
    /^[a-z]*\d{3,}$/.test(value)
  );
}
