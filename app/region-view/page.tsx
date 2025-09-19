import { Navbar } from '../../src/components/ui/navbar';
import { Footer } from '../../src/components/ui/footer';
import { BubbleMap } from '../../src/components/ui/bubble-map';
import { fetchMarketingData } from '../../src/lib/api';
import type { Campaign } from '../../src/types/marketing';

interface RegionAggregate {
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  spend: number;
  revenue: number;
}

const REGION_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'abu dhabi': { lat: 24.4539, lon: 54.3773 },
  'al ain': { lat: 24.1302, lon: 55.8023 },
  'al khobar': { lat: 26.2172, lon: 50.1971 },
  'dammam': { lat: 26.4207, lon: 50.088 },
  'doha': { lat: 25.2854, lon: 51.531 },
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'fujairah': { lat: 25.1288, lon: 56.3265 },
  'jeddah': { lat: 21.4858, lon: 39.1925 },
  'kuwait city': { lat: 29.3786, lon: 47.9903 },
  'manama': { lat: 26.2235, lon: 50.5876 },
  'muscat': { lat: 23.588, lon: 58.3829 },
  'ras al khaimah': { lat: 25.8007, lon: 55.9762 },
  'riyadh': { lat: 24.7136, lon: 46.6753 },
  'sharjah': { lat: 25.3463, lon: 55.4211 },
  'shuwaikh': { lat: 29.3499, lon: 47.9647 },
  'ajman': { lat: 25.4052, lon: 55.5136 },
  'bahrain': { lat: 26.0667, lon: 50.5577 },
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function resolveCoordinates(region: string) {
  const key = normalizeKey(region);
  return REGION_COORDINATES[key] ?? null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function aggregateRegionalPerformance(campaigns: Campaign[] = []): RegionAggregate[] {
  const totals = new Map<string, RegionAggregate>();
  const missingRegions = new Set<string>();

  campaigns.forEach((campaign) => {
    const regionalPerformance = campaign.regional_performance ?? [];

    regionalPerformance.forEach((regionStat) => {
      const coordinates = resolveCoordinates(regionStat.region);

      if (!coordinates) {
        missingRegions.add(regionStat.region);
        return;
      }

      const key = normalizeKey(regionStat.region);
      const existing = totals.get(key) ?? {
        region: regionStat.region,
        country: regionStat.country,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        spend: 0,
        revenue: 0,
      };

      const spend = Number(regionStat.spend ?? 0);
      const revenue = Number(regionStat.revenue ?? 0);

      existing.spend += Number.isFinite(spend) ? spend : 0;
      existing.revenue += Number.isFinite(revenue) ? revenue : 0;

      totals.set(key, existing);
    });
  });

  if (missingRegions.size > 0) {
    console.warn('[RegionView] Missing coordinates for regions:', Array.from(missingRegions));
  }

  return Array.from(totals.values()).sort((a, b) => b.revenue - a.revenue);
}

export default async function RegionView() {
  const marketingData = await fetchMarketingData();
  const campaigns = marketingData?.campaigns ?? [];
  const regionAggregates = aggregateRegionalPerformance(campaigns);

  const totalRevenue = regionAggregates.reduce((sum, region) => sum + region.revenue, 0);
  const totalSpend = regionAggregates.reduce((sum, region) => sum + region.spend, 0);
  const regionCount = regionAggregates.length;
  const topRevenueRegion = regionAggregates[0];

  const revenueMapData = regionAggregates
    .filter((region) => region.revenue > 0)
    .map((region) => ({
      id: `${region.region}-revenue`,
      label: region.region,
      subtitle: region.country,
      latitude: region.latitude,
      longitude: region.longitude,
      value: region.revenue,
      color: '#22C55E',
    }));

  const spendMapData = regionAggregates
    .filter((region) => region.spend > 0)
    .map((region) => ({
      id: `${region.region}-spend`,
      label: region.region,
      subtitle: region.country,
      latitude: region.latitude,
      longitude: region.longitude,
      value: region.spend,
      color: '#F97316',
    }));

  return (
    <div className="flex h-screen bg-gray-900">
      <Navbar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-12">
          <div className="px-6 lg:px-8">
            <div className="text-center space-y-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Region View
                </h1>
                <p className="mt-3 text-gray-300 text-sm md:text-base">
                  Tracking geographic performance across {regionCount} key cities
                </p>
              </div>
              {topRevenueRegion && (
                <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm md:text-base text-gray-300">
                  <span>
                    Total Revenue: <span className="text-white font-semibold">{formatCurrency(totalRevenue)}</span>
                  </span>
                  <span className="hidden sm:inline">|</span>
                  <span>
                    Total Spend: <span className="text-white font-semibold">{formatCurrency(totalSpend)}</span>
                  </span>
                  <span className="hidden sm:inline">|</span>
                  <span>
                    Top City: <span className="text-white font-semibold">{topRevenueRegion.region}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <section aria-labelledby="regional-maps" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="regional-maps" className="text-lg font-semibold text-white">
                  Regional Bubble Heat Maps
                </h2>
                <span className="text-sm text-gray-400">
                  Circle area scales with performance size
                </span>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <BubbleMap
                  title="Revenue by Region"
                  metricLabel="Revenue"
                  data={revenueMapData}
                  valueFormatter={formatCurrency}
                  description="Higher revenue cities appear with larger, green-toned markers."
                />
                <BubbleMap
                  title="Spend by Region"
                  metricLabel="Spend"
                  data={spendMapData}
                  valueFormatter={formatCurrency}
                  description="Marketing investment levels visualized by spend intensity."
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
