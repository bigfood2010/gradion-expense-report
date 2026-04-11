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
const MAX_TOKENS = 256;

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
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    this.logger.debug(`Gemini 2.5 Flash extraction result: ${raw}`);

    return parseResult(raw, input.originalName);
  }
}

function parseResult(raw: string, originalName: string): ReceiptExtractionResult {
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
  } catch {
    return {
      merchant: '',
      amount: '0.00',
      currency: 'USD',
      date: '',
      description: null,
    };
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
