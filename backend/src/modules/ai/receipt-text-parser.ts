import { ReceiptExtractionResult } from './receipt-extractor.repository';
import { normalizeExtractedMerchant } from './merchant-normalization';

const LINE_VALUE_LABELS = [
  'grand total',
  'amount paid',
  'total paid',
  'final total',
  'order total',
  'total',
  'total amount',
  'amount due',
  'amount payable',
  'subtotal',
  'amount',
] as const;

const MERCHANT_LABELS = ['merchant', 'sold by', 'seller', 'store'] as const;

const MONTHS: Record<string, string> = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  sept: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

export function parseReceiptText(text: string, originalName: string): ReceiptExtractionResult {
  const normalizedText = normalizeText(text);
  const lines = normalizedText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const amountSource = extractAmountSource(lines, normalizedText);
  const currency = extractCurrency(amountSource, normalizedText);
  const merchant = normalizeExtractedMerchant(
    buildMerchant(lines, normalizedText),
    originalName,
  );

  return {
    merchant,
    amount: normalizeAmount(amountSource, currency, normalizedText),
    currency,
    date: extractDate(lines, normalizedText),
    description: null,
  };
}

function normalizeText(text: string): string {
  return text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

function buildMerchant(lines: string[], text: string): string {
  const platform = extractMarketplacePlatform(text);
  const seller = extractSellerMerchant(lines, text);
  const brand = extractBrandMerchant(text);
  const branch = extractBranchMerchant(lines, text);

  if (platform && seller) {
    return `${platform} / ${seller}`;
  }

  if (brand && branch && canonicalMerchantToken(brand) !== canonicalMerchantToken(branch)) {
    return `${brand} / ${branch}`;
  }

  if (seller) {
    return seller;
  }

  if (brand) {
    return branch && canonicalMerchantToken(brand) !== canonicalMerchantToken(branch)
      ? `${brand} / ${branch}`
      : brand;
  }

  if (branch) {
    return branch;
  }

  const merchantLineMatch = text.match(/\bmerchant\s*[:\-]\s*([^\n]+)/i);
  if (merchantLineMatch?.[1]) {
    return merchantLineMatch[1].trim();
  }

  return '';
}

function extractSellerMerchant(lines: string[], text: string): string {
  const soldByBlock = text.match(/\bsold by\b[\s\S]{0,80}?\n([^\n]+)/i)?.[1];
  if (soldByBlock) {
    const beforeOrderNumber = soldByBlock.split(/\border number\b/i)[0]?.trim() ?? soldByBlock.trim();
    const uppercaseTokens = beforeOrderNumber.match(/\b[A-Z][A-Z0-9&.'-]{2,}\b/g);

    if (uppercaseTokens?.length) {
      return uppercaseTokens[uppercaseTokens.length - 1]!;
    }
  }

  for (const [index, line] of lines.entries()) {
    const normalizedLine = line.toLowerCase().replace(/\s+/g, ' ').trim();

    for (const label of MERCHANT_LABELS) {
      if (normalizedLine === label) {
        const candidate = lines.slice(index + 1).find((value) => isLikelyMerchant(value));
        if (candidate) {
          return candidate.trim();
        }
      }

      const inlineMatch = line.match(new RegExp(`^${label}\\s*[:\\-]?\\s*(.+)$`, 'i'));
      if (inlineMatch?.[1] && isLikelyMerchant(inlineMatch[1])) {
        return inlineMatch[1].trim();
      }
    }
  }

  return '';
}

function extractMarketplacePlatform(text: string): string {
  if (/tiktok[\s\S]{0,32}\bshop\b/i.test(text)) {
    return 'TikTok Shop';
  }

  return '';
}

function extractBrandMerchant(text: string): string {
  const footerBrand = text.match(/thank you for (?:visiting|shopping at)\s+([^\n]+)/i)?.[1]?.trim();
  if (footerBrand) {
    return footerBrand;
  }

  if (/\bstarbucks\b/i.test(text)) {
    return 'Starbucks';
  }

  return '';
}

function extractBranchMerchant(lines: string[], text: string): string {
  const firstMeaningfulLine = lines[0];

  if (firstMeaningfulLine && isLikelyBranch(firstMeaningfulLine)) {
    return firstMeaningfulLine;
  }

  const retailParkLine = lines.find((line) => /\bretail park\b/i.test(line));
  if (retailParkLine) {
    return retailParkLine.trim();
  }

  const storeLocationLine = text.match(/\b(store|branch)\s*[:#-]?\s*([^\n]+)/i)?.[2];
  if (storeLocationLine && isLikelyBranch(storeLocationLine)) {
    return storeLocationLine.trim();
  }

  return '';
}

function isLikelyBranch(value: string): boolean {
  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  if (/^\W*$/.test(normalized) || normalized.length < 4) {
    return false;
  }

  return /\b(retail park|mall|branch|center|centre|plaza|airport|station|street|road)\b/i.test(
    normalized,
  );
}

function canonicalMerchantToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function isLikelyMerchant(value: string): boolean {
  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  if (/[0-9]{4}/.test(normalized) || /\b(order|receipt|date|details)\b/i.test(normalized)) {
    return false;
  }

  return /[a-z]/i.test(normalized);
}

function extractAmountSource(lines: string[], text: string): string {
  for (const label of LINE_VALUE_LABELS) {
    const pattern = new RegExp(`\\b${escapeRegExp(label)}\\b(?:\\s*\\([^\\n]+\\))?\\s*[:\\-]?\\s*([^\\n]+)?`, 'i');
    const inlineMatch = text.match(pattern);
    const inlineValue = inlineMatch?.[1] ? findAmountToken(inlineMatch[1]) : null;
    if (inlineValue) {
      return inlineValue;
    }

    for (const [index, line] of lines.entries()) {
      const loweredLine = line.toLowerCase();
      if (!new RegExp(`\\b${escapeRegExp(label)}\\b`, 'i').test(loweredLine)) {
        continue;
      }

      const sameLine = findAmountToken(line);
      if (sameLine) {
        return sameLine;
      }

      const nextLine = lines[index + 1];
      const nextToken = nextLine ? findAmountToken(nextLine) : null;
      if (nextToken) {
        return nextToken;
      }
    }
  }

  const labeledAmount = text.match(/\bamount\s*[:\-]\s*([^\n]+)/i)?.[1];
  if (labeledAmount) {
    return labeledAmount.trim();
  }

  return '';
}

function findAmountToken(value: string): string | null {
  const match = value.match(/(?:[$€£¥₫đ]|USD|EUR|GBP|JPY|VND)?\s*[0-9][0-9.,]*/i);
  return match?.[0]?.trim() ?? null;
}

function normalizeAmount(rawValue: string, currency: string, text: string): string {
  const cleaned = rawValue.replace(/[^0-9,.-]/g, '');

  if (!cleaned) {
    return '0.00';
  }

  if (shouldInterpretAsDongThousands(cleaned, currency, text)) {
    let normalized = cleaned.replace(/,/g, '');

    if (/^\d{1,3}(?:\.\d{3})+\d$/.test(normalized)) {
      normalized = normalized.slice(0, -1);
    }

    const numericValue = Number(normalized.replace(/\./g, ''));

    if (!Number.isFinite(numericValue)) {
      return '0.00';
    }

    return numericValue.toFixed(2);
  }

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  let normalized = cleaned;

  if (lastComma !== -1 && lastDot !== -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    normalized =
      decimalSeparator === ','
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (lastComma !== -1) {
    normalized = cleaned.replace(',', '.');
  }

  const numericValue = Number(normalized);

  if (!Number.isFinite(numericValue)) {
    return '0.00';
  }

  return numericValue.toFixed(2);
}

function extractCurrency(amountSource: string, text: string): string {
  const source = `${amountSource}\n${text}`;

  if (/(₫|đ|\bVND\b)/i.test(source)) {
    return 'VND';
  }

  if (
    /\b(vietnam|ho chi minh)\b/i.test(source) &&
    /^\d{1,3}(?:\.\d{3})+\d?$/.test(amountSource.replace(/[^0-9.]/g, ''))
  ) {
    return 'VND';
  }

  if (/(€|\bEUR\b)/i.test(source)) {
    return 'EUR';
  }

  if (/(£|\bGBP\b)/i.test(source)) {
    return 'GBP';
  }

  if (/(¥|\bJPY\b)/i.test(source)) {
    return 'JPY';
  }

  return 'USD';
}

function extractDate(lines: string[], text: string): string {
  const isoDate = text.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1];
  if (isoDate) {
    return isoDate;
  }

  const slashDate = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)?\b/i);
  if (slashDate?.[1] && slashDate?.[2] && slashDate?.[3]) {
    return `${slashDate[3]}-${slashDate[1].padStart(2, '0')}-${slashDate[2].padStart(2, '0')}`;
  }

  const labeledDate =
    text.match(/\border\s+date\s*[:\-]?\s*([^\n]+)/i)?.[1] ??
    text.match(/\btransaction\s+date\s*[:\-]?\s*([^\n]+)/i)?.[1] ??
    text.match(/\breceipt\s+date\s*[:\-]?\s*([^\n]+)/i)?.[1] ??
    text.match(/\bdate\s*[:\-]?\s*([^\n]+)/i)?.[1];

  const parsedLabeledDate = labeledDate ? parseMonthNameDate(labeledDate) : null;
  if (parsedLabeledDate) {
    return parsedLabeledDate;
  }

  for (const line of lines) {
    const parsedLineDate = parseMonthNameDate(line);
    if (parsedLineDate) {
      return parsedLineDate;
    }
  }

  return new Date().toISOString().slice(0, 10);
}

function parseMonthNameDate(value: string): string | null {
  const match = value.match(/\b([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})\b/);

  if (!match) {
    return null;
  }

  const monthToken = match[1];
  const dayToken = match[2];
  const yearToken = match[3];

  if (!monthToken || !dayToken || !yearToken) {
    return null;
  }

  const month = MONTHS[monthToken.toLowerCase()];

  if (!month) {
    return null;
  }

  return `${yearToken}-${month}-${dayToken.padStart(2, '0')}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shouldInterpretAsDongThousands(cleaned: string, currency: string, text: string): boolean {
  if (currency === 'VND' && /^\d{1,3}(?:\.\d{3})+\d?$/.test(cleaned)) {
    return true;
  }

  return /\b(vietnam|ho chi minh)\b/i.test(text) && /^\d{1,3}(?:\.\d{3})+\d?$/.test(cleaned);
}
