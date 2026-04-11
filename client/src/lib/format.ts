const currencyFormatCache = new Map<string, Intl.NumberFormat>();
const dateFormatCache = new Map<string, Intl.DateTimeFormat>();

export function getPreferredLocale(): string {
  if (typeof navigator === 'undefined') {
    return 'en-US';
  }

  return navigator.languages[0] ?? navigator.language ?? 'en-US';
}

export function formatCurrency(value: number, currency: string): string {
  const locale = getPreferredLocale();
  const key = `${locale}-${currency}`;
  let formatter = currencyFormatCache.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatCache.set(key, formatter);
  }

  return formatter.format(value);
}

export function formatDate(value: string | number | Date): string {
  const locale = getPreferredLocale();
  let formatter = dateFormatCache.get(locale);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    dateFormatCache.set(locale, formatter);
  }

  const date = value instanceof Date ? value : new Date(value);
  return formatter.format(date);
}
