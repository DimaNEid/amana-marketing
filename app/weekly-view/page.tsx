import { Navbar } from '../../src/components/ui/navbar';
import { Footer } from '../../src/components/ui/footer';
import { LineChart } from '../../src/components/ui/line-chart';
import { fetchMarketingData } from '../../src/lib/api';
import type { Campaign } from '../../src/types/marketing';

interface WeeklyAggregate {
  weekStart: string;
  weekEnd: string;
  spend: number;
  revenue: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatWeekLabel(isoDate: string) {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function aggregateWeeklyPerformance(campaigns: Campaign[] = []): WeeklyAggregate[] {
  const totals = new Map<string, WeeklyAggregate>();

  campaigns.forEach((campaign) => {
    const weeklyPerformance = campaign.weekly_performance ?? [];

    weeklyPerformance.forEach((week) => {
      const key = `${week.week_start}_${week.week_end}`;
      const existing = totals.get(key) ?? {
        weekStart: week.week_start,
        weekEnd: week.week_end,
        spend: 0,
        revenue: 0,
      };

      const spend = Number(week.spend ?? 0);
      const revenue = Number(week.revenue ?? 0);

      existing.spend += Number.isFinite(spend) ? spend : 0;
      existing.revenue += Number.isFinite(revenue) ? revenue : 0;

      totals.set(key, existing);
    });
  });

  return Array.from(totals.values()).sort((a, b) => (
    new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
  ));
}

export default async function WeeklyView() {
  const marketingData = await fetchMarketingData();
  const campaigns = marketingData?.campaigns ?? [];
  const weeklyAggregates = aggregateWeeklyPerformance(campaigns);

  const revenueLineData = weeklyAggregates.map((week) => ({
    label: formatWeekLabel(week.weekStart),
    value: week.revenue,
  }));

  const spendLineData = weeklyAggregates.map((week) => ({
    label: formatWeekLabel(week.weekStart),
    value: week.spend,
  }));

  const rangeSummary = weeklyAggregates.length > 0
    ? `${formatWeekLabel(weeklyAggregates[0].weekStart)} - ${formatWeekLabel(weeklyAggregates[weeklyAggregates.length - 1].weekEnd)}`
    : null;

  return (
    <div className="flex h-screen bg-gray-900">
      <Navbar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-12">
          <div className="px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold">
                Weekly View
              </h1>
              {rangeSummary && (
                <p className="mt-3 text-gray-300 text-sm md:text-base">
                  Insights covering {rangeSummary}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <section aria-labelledby="weekly-trends" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="weekly-trends" className="text-lg font-semibold text-white">
                  Weekly Performance Trends
                </h2>
                {weeklyAggregates.length > 0 && (
                  <span className="text-sm text-gray-400">
                    {weeklyAggregates.length} weeks of performance data
                  </span>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <LineChart
                  title="Revenue by Week"
                  data={revenueLineData}
                  formatValue={(value) => formatCurrency(value)}
                />
                <LineChart
                  title="Spend by Week"
                  data={spendLineData}
                  formatValue={(value) => formatCurrency(value)}
                />
              </div>
            </section>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

