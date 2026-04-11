import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  async listByReportId(@Req() request: AuthenticatedRequest, @Param('reportId') reportId: string) {
    const user = getAuthenticatedUser(request);
    return this.itemsService.listByReportId(reportId, user.id);
  }

  @Post('reports/:reportId/items')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('receipt'))
  async uploadReceipt(
    @Req() request: AuthenticatedRequest,
    @Param('reportId') reportId: string,
    @Body() body: UpdateExpenseItemDto,
    @UploadedFile() file?: ReceiptUploadFile,
  ) {
    const user = getAuthenticatedUser(request);
    return this.itemsService.uploadReceipt(reportId, user.id, file, body);
  }

  @Patch('items/:itemId')
  async updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateExpenseItemDto,
  ) {
    const user = getAuthenticatedUser(request);
    return this.itemsService.updateItem(itemId, user.id, dto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(@Req() request: AuthenticatedRequest, @Param('itemId') itemId: string) {
    const user = getAuthenticatedUser(request);
    await this.itemsService.deleteItem(itemId, user.id);
  }
}
