import { seedItems, seedReports } from '@backend/context/seed/seed-data';

describe('seed data report details', () => {
  it('provides at least one item for every seeded report', () => {
    const itemCountByReportId = new Map<string, number>();

    for (const item of seedItems) {
      itemCountByReportId.set(item.reportId, (itemCountByReportId.get(item.reportId) ?? 0) + 1);
    }

    const reportsWithoutItems = seedReports
      .filter((report) => !itemCountByReportId.has(report.id))
      .map((report) => report.id);

    expect(reportsWithoutItems).toEqual([]);
  });

  it('provides table details for the latest Vinh seed report', () => {
    const latestVinhReport = seedReports.find((report) => report.id.endsWith('000000000271'));
    const latestVinhItems = seedItems.filter((item) => item.reportId.endsWith('000000000271'));

    expect(latestVinhReport).toBeDefined();
    expect(latestVinhItems.length).toBeGreaterThan(0);
    expect(latestVinhItems.every((item) => item.merchant && item.amount && item.date)).toBe(true);
  });
});
