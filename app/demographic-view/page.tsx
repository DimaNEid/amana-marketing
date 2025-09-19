import { ReactNode } from 'react';
import { Navbar } from '../../src/components/ui/navbar';
import { CardMetric } from '../../src/components/ui/card-metric';
import { Footer } from '../../src/components/ui/footer';
import { BarChart } from '../../src/components/ui/bar-chart';
import { GenderAgePerformanceTables } from '../../src/components/demographic/gender-age-performance-tables';
import {
  MousePointerClick,
  Wallet,
  TrendingUp,
  PiggyBank,
  DollarSign,
} from 'lucide-react';

const MARKETING_DATA_ENDPOINT =
  process.env.MARKETING_DATA_ENDPOINT ??
  'https://www.amanabootcamp.org/api/fs-classwork-data/amana-marketing';

type DemographicCard = {
  title: string;
  value: string | number;
  icon: ReactNode;
  className?: string;
};

type MarketingData = {
  campaigns?: Campaign[];
};

type Campaign = {
  spend?: number;
  revenue?: number;
  demographic_breakdown?: DemographicBreakdown[];
};

type DemographicBreakdown = {
  age_group?: string;
  gender?: string;
  percentage_of_audience?: number;
  performance?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
  };
};

type GenderTotals = {
  male: {
    clicks: number;
    spend: number;
    revenue: number;
  };
  female: {
    clicks: number;
    spend: number;
    revenue: number;
  };
};

type AgeMetrics = {
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

type AgeTotals = Map<string, AgeMetrics>;

type GenderAgeTotals = {
  male: Map<string, AgeMetrics>;
  female: Map<string, AgeMetrics>;
};

type AgeMetricKey = 'spend' | 'revenue';

type AgeTableRow = {
  ageGroup: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
};

const AGE_GROUP_ORDER = ['18-24', '25-34', '35-44', '45-54', '55+'];

const AGE_SPEND_COLOR_MAP: Record<string, string> = {
  '18-24': '#60A5FA',
  '25-34': '#3B82F6',
  '35-44': '#2563EB',
  '45-54': '#1D4ED8',
  '55+': '#1E40AF',
};

const AGE_REVENUE_COLOR_MAP: Record<string, string> = {
  '18-24': '#FDE68A',
  '25-34': '#FBBF24',
  '35-44': '#F59E0B',
  '45-54': '#D97706',
  '55+': '#B45309',
};

const DEFAULT_SPEND_COLOR = '#1E3A8A';
const DEFAULT_REVENUE_COLOR = '#92400E';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

async function fetchMarketingData(): Promise<MarketingData | null> {
  try {
    const response = await fetch(MARKETING_DATA_ENDPOINT, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch marketing data: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching marketing data for demographic view:', error);
    return null;
  }
}

function createEmptyAgeMetrics(): AgeMetrics {
  return {
    spend: 0,
    revenue: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
  };
}

function aggregateCampaignMetrics(campaigns: Campaign[] = []) {
  const genderTotals: GenderTotals = {
    male: { clicks: 0, spend: 0, revenue: 0 },
    female: { clicks: 0, spend: 0, revenue: 0 },
  };

  const ageTotals: AgeTotals = new Map();
  const genderAgeTotals: GenderAgeTotals = {
    male: new Map(),
    female: new Map(),
  };

  campaigns.forEach((campaign) => {
    const breakdowns = campaign.demographic_breakdown ?? [];

    if (breakdowns.length === 0) {
      return;
    }

    const totalPercentage = breakdowns.reduce((sum, breakdown) => (
      sum + (breakdown.percentage_of_audience ?? 0)
    ), 0);

    const spend = campaign.spend ?? 0;
    const revenue = campaign.revenue ?? 0;

    breakdowns.forEach((segment) => {
      const share = segment.percentage_of_audience !== undefined && totalPercentage > 0
        ? segment.percentage_of_audience / totalPercentage
        : 1 / breakdowns.length;

      const impressions = segment.performance?.impressions ?? 0;
      const clicks = segment.performance?.clicks ?? 0;
      const conversions = segment.performance?.conversions ?? 0;

      const spendShare = spend * share;
      const revenueShare = revenue * share;

      const genderKey = (segment.gender ?? '').toLowerCase();
      const ageGroup = segment.age_group ?? 'Unknown';

      const currentAgeTotals = ageTotals.get(ageGroup) ?? createEmptyAgeMetrics();
      ageTotals.set(ageGroup, {
        spend: currentAgeTotals.spend + spendShare,
        revenue: currentAgeTotals.revenue + revenueShare,
        impressions: currentAgeTotals.impressions + impressions,
        clicks: currentAgeTotals.clicks + clicks,
        conversions: currentAgeTotals.conversions + conversions,
      });

      if (genderKey === 'male' || genderKey === 'female') {
        genderTotals[genderKey].clicks += clicks;
        genderTotals[genderKey].spend += spendShare;
        genderTotals[genderKey].revenue += revenueShare;

        const genderAgeMap = genderAgeTotals[genderKey];
        const currentGenderAgeMetrics = genderAgeMap.get(ageGroup) ?? createEmptyAgeMetrics();
        genderAgeMap.set(ageGroup, {
          spend: currentGenderAgeMetrics.spend + spendShare,
          revenue: currentGenderAgeMetrics.revenue + revenueShare,
          impressions: currentGenderAgeMetrics.impressions + impressions,
          clicks: currentGenderAgeMetrics.clicks + clicks,
          conversions: currentGenderAgeMetrics.conversions + conversions,
        });
      }
    });
  });

  return { genderTotals, ageTotals, genderAgeTotals };
}

function buildDemographicCards(genderTotals: GenderTotals): DemographicCard[] {
  return [
    {
      title: 'Total Clicks by Males',
      value: genderTotals.male.clicks,
      icon: <MousePointerClick className="h-5 w-5 text-blue-400" />,
      className: 'border-blue-500/30',
    },
    {
      title: 'Total Spend by Males',
      value: formatCurrency(genderTotals.male.spend),
      icon: <Wallet className="h-5 w-5 text-blue-400" />,
      className: 'border-blue-500/30',
    },
    {
      title: 'Total Revenue by Males',
      value: formatCurrency(genderTotals.male.revenue),
      icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
      className: 'border-blue-500/30',
    },
    {
      title: 'Total Clicks by Females',
      value: genderTotals.female.clicks,
      icon: <MousePointerClick className="h-5 w-5 text-pink-400" />,
      className: 'border-pink-500/30',
    },
    {
      title: 'Total Spend by Females',
      value: formatCurrency(genderTotals.female.spend),
      icon: <PiggyBank className="h-5 w-5 text-pink-400" />,
      className: 'border-pink-500/30',
    },
    {
      title: 'Total Revenue by Females',
      value: formatCurrency(genderTotals.female.revenue),
      icon: <DollarSign className="h-5 w-5 text-pink-400" />,
      className: 'border-pink-500/30',
    },
  ];
}

function buildOrderedAgeGroups(ageTotals: AgeTotals) {
  const additionalAgeGroups = Array.from(ageTotals.keys())
    .filter((ageGroup) => !AGE_GROUP_ORDER.includes(ageGroup))
    .sort();

  return [...AGE_GROUP_ORDER, ...additionalAgeGroups];
}

function buildAgeSeries(
  ageTotals: AgeTotals,
  orderedAgeGroups: string[],
  metricKey: AgeMetricKey,
  colorMap: Record<string, string>,
  fallbackColor: string,
) {
  return orderedAgeGroups.flatMap((label) => {
    const totals = ageTotals.get(label);
    const value = totals?.[metricKey] ?? 0;

    if (value <= 0) {
      return [];
    }

    return [{
      label,
      value,
      color: colorMap[label] ?? fallbackColor,
    }];
  });
}

function buildGenderAgeTableData(
  genderAgeTotals: Map<string, AgeMetrics>,
  orderedAgeGroups: string[],
): AgeTableRow[] {
  const orderedWithExtras = [
    ...orderedAgeGroups,
    ...Array.from(genderAgeTotals.keys()).filter((ageGroup) => !orderedAgeGroups.includes(ageGroup)),
  ];

  const rows: AgeTableRow[] = [];

  orderedWithExtras.forEach((ageGroup) => {
    const totals = genderAgeTotals.get(ageGroup);
    if (!totals) {
      return;
    }

    const hasActivity = totals.impressions > 0 || totals.clicks > 0 || totals.conversions > 0;
    if (!hasActivity) {
      return;
    }

    const ctr = totals.impressions > 0
      ? (totals.clicks / totals.impressions) * 100
      : 0;

    const conversionRate = totals.clicks > 0
      ? (totals.conversions / totals.clicks) * 100
      : 0;

    rows.push({
      ageGroup,
      impressions: Math.round(totals.impressions),
      clicks: Math.round(totals.clicks),
      conversions: Math.round(totals.conversions),
      ctr,
      conversionRate,
    });
  });

  return rows;
}

export default async function DemographicView() {
  const marketingData = await fetchMarketingData();
  const campaigns = marketingData?.campaigns ?? [];
  const { genderTotals, ageTotals, genderAgeTotals } = aggregateCampaignMetrics(campaigns);
  const demographicCards = buildDemographicCards(genderTotals);
  const orderedAgeGroups = buildOrderedAgeGroups(ageTotals);

  const ageSpendData = buildAgeSeries(
    ageTotals,
    orderedAgeGroups,
    'spend',
    AGE_SPEND_COLOR_MAP,
    DEFAULT_SPEND_COLOR,
  );

  const ageRevenueData = buildAgeSeries(
    ageTotals,
    orderedAgeGroups,
    'revenue',
    AGE_REVENUE_COLOR_MAP,
    DEFAULT_REVENUE_COLOR,
  );

  const maleAgeTableData = buildGenderAgeTableData(genderAgeTotals.male, orderedAgeGroups);
  const femaleAgeTableData = buildGenderAgeTableData(genderAgeTotals.female, orderedAgeGroups);

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
                Demographic View
              </h1>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <section aria-labelledby="gender-metrics">
              <div className="flex items-center justify-between mb-4">
                <h2 id="gender-metrics" className="text-lg font-semibold text-white">
                  Gender Performance Overview
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {demographicCards.map((metric) => (
                  <CardMetric
                    key={metric.title}
                    title={metric.title}
                    value={metric.value}
                    icon={metric.icon}
                    className={metric.className}
                  />
                ))}
              </div>
            </section>

            <section aria-labelledby="age-performance" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="age-performance" className="text-lg font-semibold text-white">
                  Age Group Performance
                </h2>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <BarChart
                  title="Total Spend by Age Group"
                  data={ageSpendData}
                  height={320}
                  formatValue={(value) => `$${Math.round(value).toLocaleString()}`}
                />
                <BarChart
                  title="Total Revenue by Age Group"
                  data={ageRevenueData}
                  height={320}
                  formatValue={(value) => `$${Math.round(value).toLocaleString()}`}
                />
              </div>
            </section>
            <section aria-labelledby="gender-age-tables" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="gender-age-tables" className="text-lg font-semibold text-white">
                  Campaign Performance by Gender &amp; Age
                </h2>
              </div>

              <GenderAgePerformanceTables
                maleData={maleAgeTableData}
                femaleData={femaleAgeTableData}
              />
            </section>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}







