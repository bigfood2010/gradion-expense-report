import {
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
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CreateExpenseReportDto } from '@backend/modules/reports/dto/create-expense-report.dto';
import { ListExpenseReportsQueryDto } from '@backend/modules/reports/dto/list-expense-reports.query.dto';
import { UpdateExpenseReportDto } from '@backend/modules/reports/dto/update-expense-report.dto';
import {
  getAuthenticatedUser,
  getAuthenticatedUserWithRole,
  type AuthenticatedRequest,
} from '@backend/common/request-context';
import { ReportsService } from '@backend/modules/reports/reports.service';
import { UserRole } from '@backend/modules/users/domain/user-role.enum';

@Controller({
  path: 'reports',
  version: '1',
})
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async listOwnReports(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListExpenseReportsQueryDto,
  ) {
    const user = getAuthenticatedUser(request);
    return this.reportsService.listOwnReports(user.id, query);
  }

  @Get('summary')
  async getOwnDashboardSummary(@Req() request: AuthenticatedRequest) {
    const user = getAuthenticatedUser(request);
    return this.reportsService.getOwnDashboardSummary(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOwnReport(@Req() request: AuthenticatedRequest, @Body() dto: CreateExpenseReportDto) {
    const user = getAuthenticatedUser(request);
    return this.reportsService.createOwnReport(user.id, dto);
  }

  @Get(':reportId')
  async getOwnReport(
    @Req() request: AuthenticatedRequest,
    @Param('reportId', new ParseUUIDPipe()) reportId: string,
  ) {
    const user = getAuthenticatedUser(request);
    return this.reportsService.getOwnReport(user.id, reportId);
  }

  @Patch(':reportId')
  async updateOwnReport(
    @Req() request: AuthenticatedRequest,
    @Param('reportId', new ParseUUIDPipe()) reportId: string,
    @Body() dto: UpdateExpenseReportDto,
  ) {
    const user = getAuthenticatedUser(request);
    return this.reportsService.updateOwnReport(user.id, reportId, dto);
  }

  @Delete(':reportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOwnReport(
    @Req() request: AuthenticatedRequest,
    @Param('reportId', new ParseUUIDPipe()) reportId: string,
  ) {
    const user = getAuthenticatedUser(request);
    await this.reportsService.deleteOwnReport(user.id, reportId);
  }

  @Patch(':reportId/submit')
  async submitOwnReport(
    @Req() request: AuthenticatedRequest,
    @Param('reportId', new ParseUUIDPipe()) reportId: string,
  ) {
    const user = getAuthenticatedUser(request);
    return this.reportsService.submitOwnReport(user.id, reportId);
  }
}

@Controller({
  path: 'admin/reports',
  version: '1',
})
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
)
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async listAllReports(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListExpenseReportsQueryDto,
  ) {
    getAuthenticatedUserWithRole(request, UserRole.ADMIN);
    return this.reportsService.listAllReports(query);
  }

  @Patch(':reportId/approve')
  async approveReport(
    @Req() request: AuthenticatedRequest,
    @Param('reportId', new ParseUUIDPipe()) reportId: string,
  ) {
    getAuthenticatedUserWithRole(request, UserRole.ADMIN);
    return this.reportsService.approveReport(reportId);
  }

  @Patch(':reportId/reject')
  async rejectReport(
    @Req() request: AuthenticatedRequest,
    @Param('reportId', new ParseUUIDPipe()) reportId: string,
  ) {
    getAuthenticatedUserWithRole(request, UserRole.ADMIN);
    return this.reportsService.rejectReport(reportId);
  }
}
