import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { getAuthenticatedUser, type AuthenticatedRequest } from '@backend/common/request-context';
import { UpdateExpenseItemDto } from '@backend/modules/items/dto/update-expense-item.dto';
import { ItemsService } from '@backend/modules/items/items.service';
import type { ReceiptUploadFile } from '@backend/modules/items/items.types';
import {
  isAllowedReceiptMimeType,
  MAX_RECEIPT_UPLOAD_BYTES,
} from '@backend/modules/items/receipt-upload.validation';

@Controller({ version: '1' })
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('reports/:reportId/items')
  async listByReportId(
    @Req() request: AuthenticatedRequest,
    @Param('reportId', new ParseUUIDPipe()) reportId: string,
  ) {
    const user = getAuthenticatedUser(request);
    return this.itemsService.listByReportId(reportId, user.id);
  }

  @Post('reports/:reportId/items')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: { fileSize: MAX_RECEIPT_UPLOAD_BYTES },
      fileFilter: (_request, file, callback) => {
        if (!isAllowedReceiptMimeType(file.mimetype)) {
          callback(new BadRequestException('Receipt file type is not supported.'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadReceipt(
    @Req() request: AuthenticatedRequest,
    @Param('reportId', new ParseUUIDPipe()) reportId: string,
    @Body() body: UpdateExpenseItemDto,
    @UploadedFile() file?: ReceiptUploadFile,
  ) {
    const user = getAuthenticatedUser(request);
    return this.itemsService.uploadReceipt(reportId, user.id, file, body);
  }

  @Patch('items/:itemId')
  async updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateExpenseItemDto,
  ) {
    const user = getAuthenticatedUser(request);
    return this.itemsService.updateItem(itemId, user.id, dto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @Req() request: AuthenticatedRequest,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    const user = getAuthenticatedUser(request);
    await this.itemsService.deleteItem(itemId, user.id);
  }
}
