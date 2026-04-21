import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

import {
  ReceiptExtractionInput,
  ReceiptExtractionResult,
  ReceiptExtractorRepository,
} from './receipt-extractor.repository';
import { normalizeExtractedMerchant } from './merchant-normalization';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_TEXT_CHARS = 4000;
// gemini-2.5-flash uses ~200-300 thinking tokens internally before emitting the
// visible response.  The previous value of 256 left fewer than 20 tokens for the
// actual JSON, causing truncated output and silent parse failures.  1024 is the
// safe lower-bound: thinking (~241) + JSON payload (~66) + headroom.
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are an expert receipt understanding model for expense management.

Your job is to extract the merchant of record, the final amount actually paid, the transaction currency, the transaction date, and a short purchase description.

Return ONLY a valid JSON object with exactly these keys:
- "merchant": string
- "amount": string
- "currency": string
- "date": string
- "description": string or null

Extraction rules:
1. Merchant means the business that issued or fulfilled the receipt, not the file name, not the customer name, not the product name.
2. Never use the uploaded file name, image name, words like "receipt", "image", or "screenshot" as the merchant.
3. Prefer merchant evidence in this order:
   a. branded store or marketplace header/logo text
   b. explicit seller labels like "Sold By", "Merchant", "Store", "Seller"
   c. footer lines like "Thank you for visiting Starbucks"
4. If both a marketplace/platform and the actual seller are present, combine them as "Platform / Seller".
   Example: "TikTok Shop / AOAHOUSE".
5. If both a brand and a branch/store location are present, combine them as "Brand / Branch".
   Example: "Starbucks / Riverside Retail Park".
6. Amount must be the final paid amount, not subtotal, not tax, not shipping, not discount.
   Prefer labels like "Grand total", "Total", "Amount paid", "Total paid".
7. Currency must be a 3-letter ISO code. Infer from symbols and locale if needed.
8. Date must be the transaction/order date in YYYY-MM-DD format.
   Prefer purchase/order/payment date over upload date or current date.
9. Description should be a short summary of purchased goods if clear, otherwise null.
10. If a field is genuinely unclear, return:
   - merchant: ""
   - amount: "0.00"
   - currency: "USD"
   - date: ""
   - description: null

Output constraints:
- Return JSON only.
- No markdown.
- No code fences.
- No commentary.`;

@Injectable()
export class OpenAIReceiptExtractorService extends ReceiptExtractorRepository {
  private readonly client: OpenAI;
  private readonly logger = new Logger(OpenAIReceiptExtractorService.name);

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL });
  }

  async extract(input: ReceiptExtractionInput): Promise<ReceiptExtractionResult> {
    const isImage = input.mimeType.startsWith('image/');

    let userContent: OpenAI.ChatCompletionUserMessageParam['content'];

    if (isImage) {
      const base64 = input.buffer.toString('base64');
      userContent = [
        { type: 'text', text: 'Extract the expense data from this receipt image.' },
        {
          type: 'image_url',
          image_url: {
            url: `data:${input.mimeType};base64,${base64}`,
          },
        },
      ];
    } else {
      const text = input.buffer.toString('utf-8').slice(0, MAX_TEXT_CHARS);
      userContent = `Extract the expense data from this receipt:\n\n${text}`;
    }

    const response = await this.client.chat.completions.create({
      model: GEMINI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0,
      max_tokens: MAX_TOKENS,
    });

    const choice = response.choices[0];
    const raw = choice?.message?.content;

    if (!raw) {
      throw new Error(`Gemini returned empty response for ${input.originalName}`);
    }

    if (choice.finish_reason === 'length') {
      throw new Error(
        `Gemini response was truncated (finish_reason=length) for ${input.originalName}. ` +
          `Increase MAX_TOKENS or reduce prompt size.`,
      );
    }

    this.logger.debug(
      `Gemini raw extraction complete for ${input.originalName} (${raw.length} chars)`,
    );

    return parseResult(raw, input.originalName, this.logger);
  }
}

function parseResult(raw: string, originalName: string, logger: Logger): ReceiptExtractionResult {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const merchant = normalizeExtractedMerchant(parsed.merchant, originalName);

    const amount = normalizeAmount(parsed.amount);
    const currency = normalizeCurrency(parsed.currency);
    const date = normalizeDate(parsed.date);
    const description =
      typeof parsed.description === 'string' && parsed.description.trim()
        ? parsed.description.trim()
        : null;

    return { merchant, amount, currency, date, description };
  } catch (error) {
    logger.error(
      `Failed to parse extraction result for ${originalName} (${raw.length} chars)`,
      error instanceof Error ? error.stack : String(error),
    );
    throw new Error(`Extraction result was not valid JSON for ${originalName}.`);
  }
}

function normalizeAmount(value: unknown): string {
  const num = Number(value);
  if (!isFinite(num) || num < 0) return '0.00';
  return num.toFixed(2);
}

function normalizeCurrency(value: unknown): string {
  if (typeof value === 'string' && /^[A-Z]{3}$/.test(value.toUpperCase())) {
    return value.toUpperCase();
  }
  return 'USD';
}

function normalizeDate(value: unknown): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return '';
}
