import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ItemsModule } from '@backend/modules/items/items.module';
import { StorageModule } from '@backend/modules/storage/storage.module';
import { hasConfiguredAiProviderApiKey } from '@backend/modules/ai/ai-provider-config';
import { AsyncExtractionDispatcherService } from '@backend/modules/ai/async-extraction-dispatcher.service';
import { EXTRACTION_DISPATCHER, RECEIPT_EXTRACTOR } from '@backend/modules/ai/ai.tokens';
import { MockReceiptExtractorService } from '@backend/modules/ai/mock-receipt-extractor.service';
import { OpenAIReceiptExtractorService } from '@backend/modules/ai/openai-receipt-extractor.service';
import { ReceiptExtractionProcessorService } from '@backend/modules/ai/receipt-extraction.processor.service';
import { ReceiptExtractorRepository } from '@backend/modules/ai/receipt-extractor.repository';

@Module({
  imports: [StorageModule, forwardRef(() => ItemsModule)],
  providers: [
    MockReceiptExtractorService,
    ReceiptExtractionProcessorService,
    AsyncExtractionDispatcherService,
    {
      provide: RECEIPT_EXTRACTOR,
      useFactory: (
        mock: MockReceiptExtractorService,
        config: ConfigService,
      ): ReceiptExtractorRepository => {
        const apiKey = config.get<string>('AI_PROVIDER_API_KEY');
        if (hasConfiguredAiProviderApiKey(apiKey)) {
          return new OpenAIReceiptExtractorService(apiKey!.trim());
        }
        return mock;
      },
      inject: [MockReceiptExtractorService, ConfigService],
    },
    {
      provide: EXTRACTION_DISPATCHER,
      useExisting: AsyncExtractionDispatcherService,
    },
  ],
  exports: [EXTRACTION_DISPATCHER, RECEIPT_EXTRACTOR, ReceiptExtractionProcessorService],
})
export class AiModule {}
