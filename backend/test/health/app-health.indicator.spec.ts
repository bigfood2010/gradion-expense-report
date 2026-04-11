import { ApplicationHealthIndicator } from '@backend/health/app-health.indicator';

describe('ApplicationHealthIndicator', () => {
  it('returns an up status', async () => {
    const indicator = new ApplicationHealthIndicator();

    await expect(indicator.isHealthy('application')).resolves.toEqual({
      application: {
        status: 'up',
      },
    });
  });
});
