"use client";

import type { ReactNode } from 'react';
import { Table } from '../ui/table';

interface TableColumn {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => ReactNode;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'date';
}

export type GenderAgeTableRow = {
  ageGroup: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
};

const AGE_TABLE_COLUMNS: TableColumn[] = [
  {
    key: 'ageGroup',
    header: 'Age Group',
    sortable: true,
    sortType: 'string',
  },
  {
    key: 'impressions',
    header: 'Impressions',
    align: 'right',
    sortable: true,
    sortType: 'number',
    render: (value: number) => value.toLocaleString(),
  },
  {
    key: 'clicks',
    header: 'Clicks',
    align: 'right',
    sortable: true,
    sortType: 'number',
    render: (value: number) => value.toLocaleString(),
  },
  {
    key: 'conversions',
    header: 'Conversions',
    align: 'right',
    sortable: true,
    sortType: 'number',
    render: (value: number) => value.toLocaleString(),
  },
  {
    key: 'ctr',
    header: 'CTR',
    align: 'right',
    sortable: true,
    sortType: 'number',
    render: (value: number) => `${value.toFixed(2)}%`,
  },
  {
    key: 'conversionRate',
    header: 'Conversion Rate',
    align: 'right',
    sortable: true,
    sortType: 'number',
    render: (value: number) => `${value.toFixed(2)}%`,
  },
];

interface GenderAgePerformanceTablesProps {
  maleData: GenderAgeTableRow[];
  femaleData: GenderAgeTableRow[];
}

export function GenderAgePerformanceTables({
  maleData,
  femaleData,
}: GenderAgePerformanceTablesProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Table
        title="Campaign Performance by Male Age Groups"
        columns={AGE_TABLE_COLUMNS}
        data={maleData}
        showIndex
        emptyMessage="No performance data available for male audiences"
        defaultSort={{ key: 'impressions', direction: 'desc' }}
      />
      <Table
        title="Campaign Performance by Female Age Groups"
        columns={AGE_TABLE_COLUMNS}
        data={femaleData}
        showIndex
        emptyMessage="No performance data available for female audiences"
        defaultSort={{ key: 'impressions', direction: 'desc' }}
      />
    </div>
  );
}
