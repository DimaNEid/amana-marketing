import { Navbar } from '../../src/components/ui/navbar';
import { Footer } from '../../src/components/ui/footer';
import { CardMetric } from '../../src/components/ui/card-metric';
import { BarChart } from '../../src/components/ui/bar-chart';
import { fetchMarketingData } from '../../src/lib/api';
import type { Campaign } from '../../src/types/marketing';
import {
  Smartphone,
  Monitor,
  Wallet,
  TrendingUp,
  MousePointerClick,
} from 'lucide-react';

type DeviceKey = 'mobile' | 'desktop';

type DeviceAggregate = {
  device: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
};

type DeviceMetrics = DeviceAggregate & {
  ctr: number;
  conversionRate: number;
  roas: number | null;
  trafficShare: number;
};

const DEVICE_ORDER: DeviceKey[] = ['mobile', 'desktop'];

const DEVICE_LABELS: Record<DeviceKey, string> = {
  mobile: 'Mobile',
  desktop: 'Desktop',
};

const DEVICE_COLORS: Record<DeviceKey, { primary: string; border: string }> = {
  mobile: {
    primary: '#60A5FA',
    border: 'border-sky-500/40',
  },
  desktop: {
    primary: '#F97316',
    border: 'border-amber-500/40',
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function aggregateDevicePerformance(campaigns: Campaign[] = []) {
  const totals = new Map<DeviceKey, DeviceAggregate>();

  campaigns.forEach((campaign) => {
    const devicePerformance = campaign.device_performance ?? [];

    devicePerformance.forEach((deviceStat) => {
      const key = deviceStat.device?.toLowerCase();
      if (key !== 'mobile' && key !== 'desktop') {
        return;
      }

      const impressions = Number(deviceStat.impressions ?? 0);
      const clicks = Number(deviceStat.clicks ?? 0);
      const conversions = Number(deviceStat.conversions ?? 0);
      const spend = Number(deviceStat.spend ?? 0);
      const revenue = Number(deviceStat.revenue ?? 0);

      const existing = totals.get(key) ?? {
        device: DEVICE_LABELS[key],
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      };

      existing.impressions += Number.isFinite(impressions) ? impressions : 0;
      existing.clicks += Number.isFinite(clicks) ? clicks : 0;
      existing.conversions += Number.isFinite(conversions) ? conversions : 0;
      existing.spend += Number.isFinite(spend) ? spend : 0;
      existing.revenue += Number.isFinite(revenue) ? revenue : 0;

      totals.set(key, existing);
    });
  });

  return totals;
}

function enrichMetrics(totals: Map<DeviceKey, DeviceAggregate>): Record<DeviceKey, DeviceMetrics> {
  const totalClicks = Array.from(totals.values()).reduce((sum, item) => sum + item.clicks, 0);

  return DEVICE_ORDER.reduce((acc, key) => {
    const aggregate = totals.get(key) ?? {
      device: DEVICE_LABELS[key],
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
    };

    const ctr = aggregate.impressions > 0 ? (aggregate.clicks / aggregate.impressions) * 100 : 0;
    const conversionRate = aggregate.clicks > 0 ? (aggregate.conversions / aggregate.clicks) * 100 : 0;
    const roas = aggregate.spend > 0 ? aggregate.revenue / aggregate.spend : null;
    const trafficShare = totalClicks > 0 ? (aggregate.clicks / totalClicks) * 100 : 0;

    acc[key] = {
      ...aggregate,
      ctr,
      conversionRate,
      roas,
      trafficShare,
    };

    return acc;
  }, {} as Record<DeviceKey, DeviceMetrics>);
}

export default async function DeviceView() {
  const marketingData = await fetchMarketingData();
  const campaigns = marketingData?.campaigns ?? [];

  const deviceTotals = aggregateDevicePerformance(campaigns);
  const metrics = enrichMetrics(deviceTotals);

  const summaryCards = DEVICE_ORDER.flatMap((key) => {
    const stats = metrics[key];
    const label = DEVICE_LABELS[key];
    const colors = DEVICE_COLORS[key];

    return [
      {
        title: `${label} Revenue`,
        value: formatCurrency(stats.revenue),
        icon: <TrendingUp className="h-5 w-5" style={{ color: colors.primary }} />,
        className: `${colors.border} bg-gray-800/70`,
      },
      {
        title: `${label} Spend`,
        value: formatCurrency(stats.spend),
        icon: <Wallet className="h-5 w-5" style={{ color: colors.primary }} />,
        className: `${colors.border} bg-gray-800/70`,
      },
      {
        title: `${label} Conversions`,
        value: stats.conversions.toLocaleString(),
        icon: <MousePointerClick className="h-5 w-5" style={{ color: colors.primary }} />,
        className: `${colors.border} bg-gray-800/70`,
      },
    ];
  });

  const spendComparison = DEVICE_ORDER.map((key) => ({
    label: DEVICE_LABELS[key],
    value: metrics[key].spend,
    color: DEVICE_COLORS[key].primary,
  }));

  const revenueComparison = DEVICE_ORDER.map((key) => ({
    label: DEVICE_LABELS[key],
    value: metrics[key].revenue,
    color: DEVICE_COLORS[key].primary,
  }));

  const conversionComparison = DEVICE_ORDER.map((key) => ({
    label: DEVICE_LABELS[key],
    value: metrics[key].conversions,
    color: DEVICE_COLORS[key].primary,
  }));

  const mobileStats = metrics.mobile;
  const desktopStats = metrics.desktop;

  const revenueDelta = mobileStats.revenue - desktopStats.revenue;
  const spendDelta = mobileStats.spend - desktopStats.spend;
  const trafficShareMobile = mobileStats.trafficShare;

  const revenueDeltaLabel = revenueDelta >= 0 ? 'outpaces' : 'trails';
  const spendDeltaLabel = spendDelta >= 0 ? 'exceeds' : 'lags behind';

  return (
    <div className="flex h-screen bg-gray-900">
      <Navbar />

      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-12">
          <div className="px-6 lg:px-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 text-sm md:text-base text-gray-300">
                <Smartphone className="h-5 w-5 text-blue-300" />
                <span>Device Performance Intelligence</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold">Device View</h1>
              <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
                Compare how marketing campaigns perform on mobile versus desktop across spend, revenue, efficiency, and traffic share.
              </p>
            </div>
          </div>
        </section>

        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <section aria-labelledby="device-overview" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="device-overview" className="text-lg font-semibold text-white">
                  Channel Overview
                </h2>
                <span className="text-sm text-gray-400">
                  Mobile share of clicks: {formatPercentage(trafficShareMobile)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {summaryCards.map((card) => (
                  <CardMetric
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    className={card.className}
                  />
                ))}
              </div>
            </section>

            <section aria-labelledby="device-comparison" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="device-comparison" className="text-lg font-semibold text-white">
                  Spend & Revenue Comparison
                </h2>
                <span className="text-sm text-gray-400">
                  Mobile revenue {revenueDeltaLabel} desktop by {formatCurrency(Math.abs(revenueDelta))}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <BarChart
                  title="Marketing Spend by Device"
                  data={spendComparison}
                  height={320}
                  formatValue={(value) => formatCurrency(value)}
                />
                <BarChart
                  title="Revenue by Device"
                  data={revenueComparison}
                  height={320}
                  formatValue={(value) => formatCurrency(value)}
                />
              </div>
            </section>

            <section aria-labelledby="conversion-insights" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="conversion-insights" className="text-lg font-semibold text-white">
                  Conversion Insights
                </h2>
                <span className="text-sm text-gray-400">
                  Mobile spend {spendDeltaLabel} desktop by {formatCurrency(Math.abs(spendDelta))}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <BarChart
                  title="Conversions by Device"
                  data={conversionComparison}
                  height={320}
                  formatValue={(value) => value.toLocaleString()}
                />
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white">Metric Breakdown</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-gray-900/40 border border-gray-700 rounded-md p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Smartphone className="h-4 w-4 text-blue-300" />
                        <span>Mobile CTR</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-white">{formatPercentage(mobileStats.ctr)}</p>
                      <p className="text-xs text-gray-500 mt-1">{mobileStats.clicks.toLocaleString()} clicks from {mobileStats.impressions.toLocaleString()} impressions</p>
                    </div>
                    <div className="bg-gray-900/40 border border-gray-700 rounded-md p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Monitor className="h-4 w-4 text-amber-300" />
                        <span>Desktop CTR</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-white">{formatPercentage(desktopStats.ctr)}</p>
                      <p className="text-xs text-gray-500 mt-1">{desktopStats.clicks.toLocaleString()} clicks from {desktopStats.impressions.toLocaleString()} impressions</p>
                    </div>
                    <div className="bg-gray-900/40 border border-gray-700 rounded-md p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Smartphone className="h-4 w-4 text-blue-300" />
                        <span>Mobile ROAS</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-white">{mobileStats.roas ? `${mobileStats.roas.toFixed(1)}x` : 'NA'}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatCurrency(mobileStats.revenue)} revenue</p>
                    </div>
                    <div className="bg-gray-900/40 border border-gray-700 rounded-md p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Monitor className="h-4 w-4 text-amber-300" />
                        <span>Desktop ROAS</span>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-white">{desktopStats.roas ? `${desktopStats.roas.toFixed(1)}x` : 'NA'}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatCurrency(desktopStats.revenue)} revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}