import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ExpenseItemEntity,
  ExpenseReportEntity,
  UserEntity,
} from '@backend/infrastructure/persistence';
import { createItemFixture, createReportFixture, createUserFixture } from './persistence-test-data';
import { ReportWorkflowMachine } from './report-workflow.machine';

@Injectable()
export class TestReportWorkflowService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ExpenseReportEntity)
    private readonly reportRepository: Repository<ExpenseReportEntity>,
    @InjectRepository(ExpenseItemEntity)
    private readonly itemRepository: Repository<ExpenseItemEntity>,
  ) {}

  async createDraftReportWithItem(): Promise<ExpenseReportEntity> {
    const user = await this.userRepository.save(this.userRepository.create(createUserFixture()));
    const report = await this.reportRepository.save(
      this.reportRepository.create({
        ...createReportFixture(),
        userId: user.id,
      }),
    );

    await this.itemRepository.save(
      this.itemRepository.create({
        ...createItemFixture(),
        reportId: report.id,
      }),
    );

    return this.getReport(report.id);
  }

  async addItem(
    reportId: string,
    overrides: Partial<ExpenseItemEntity> = {},
  ): Promise<ExpenseItemEntity> {
    const report = await this.getReport(reportId);
    const machine = new ReportWorkflowMachine(report.status);

    report.status = machine.applyUserItemMutation('user');
    await this.reportRepository.save(report);

    return this.itemRepository.save(
      this.itemRepository.create({
        ...createItemFixture(),
        ...overrides,
        reportId,
      }),
    );
  }

  async submit(reportId: string): Promise<ExpenseReportEntity> {
    const report = await this.getReport(reportId);
    const machine = new ReportWorkflowMachine(report.status);

    report.status = machine.submit('user');
    await this.reportRepository.save(report);

    return this.getReport(reportId);
  }

  async approve(reportId: string): Promise<ExpenseReportEntity> {
    const report = await this.getReport(reportId);
    const machine = new ReportWorkflowMachine(report.status);

    report.status = machine.approve('admin');
    await this.reportRepository.save(report);

    return this.getReport(reportId);
  }

  async reject(reportId: string): Promise<ExpenseReportEntity> {
    const report = await this.getReport(reportId);
    const machine = new ReportWorkflowMachine(report.status);

    report.status = machine.reject('admin');
    await this.reportRepository.save(report);

    return this.getReport(reportId);
  }

  async getReport(reportId: string): Promise<ExpenseReportEntity> {
    const report = await this.reportRepository.findOneOrFail({
      where: { id: reportId },
      relations: {
        user: true,
        items: true,
      },
    });

    report.recalculateTotalAmount();
    return report;
  }
}
