import { Injectable, Logger } from '@nestjs/common';

import { ExtractionDispatcherRepository } from './extraction-dispatcher.repository';
import { ReceiptExtractionProcessorService } from './receipt-extraction.processor.service';

@Injectable()
export class AsyncExtractionDispatcherService extends ExtractionDispatcherRepository {
  private readonly logger = new Logger(AsyncExtractionDispatcherService.name);

  constructor(
    private readonly receiptExtractionProcessorService: ReceiptExtractionProcessorService,
  ) {
    super();
  }

  async dispatch(itemId: string): Promise<void> {
    setTimeout(() => {
      this.receiptExtractionProcessorService.process(itemId).catch((error: unknown) => {
        this.logger.error(`Receipt extraction failed for item ${itemId}`, error);
      });
    }, 0);
  }
}
