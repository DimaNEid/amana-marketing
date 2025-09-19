interface LineChartDataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  title: string;
  data: LineChartDataPoint[];
  className?: string;
  height?: number;
  formatValue?: (value: number) => string;
  showDots?: boolean;
}

const DEFAULT_HEIGHT = 320;

export function LineChart({
  title,
  data,
  className = '',
  height = DEFAULT_HEIGHT,
  formatValue = (value) => value.toLocaleString(),
  showDots = true,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const chartHeight = height;
  const margin = { top: 36, right: 36, bottom: 48, left: 60 };
  const innerHeight = chartHeight - margin.top - margin.bottom;
  const innerWidth = Math.max((data.length - 1) * 80, 240);
  const width = innerWidth + margin.left + margin.right;

  const maxValue = Math.max(...data.map((point) => point.value), 0);
  const safeMaxValue = maxValue > 0 ? maxValue : 1;

  const points = data.map((point, index) => {
    const x = margin.left + (
      data.length === 1
        ? innerWidth / 2
        : (index / (data.length - 1)) * innerWidth
    );

    const y = margin.top + (
      safeMaxValue > 0
        ? (1 - point.value / safeMaxValue) * innerHeight
        : innerHeight
    );

    return { ...point, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = [
    `M ${points[0].x} ${margin.top + innerHeight}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1].x} ${margin.top + innerHeight}`,
    'Z',
  ].join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="text-sm text-gray-400">
          Latest: {formatValue(data[data.length - 1].value)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full min-w-full"
          role="img"
          aria-label={`${title} line chart`}
        >
          <defs>
            <linearGradient id="lineChartArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
          </defs>

          <g>
            {gridLines.map((ratio, index) => {
              const y = margin.top + ratio * innerHeight;
              const value = safeMaxValue * (1 - ratio);

              return (
                <g key={ratio}>
                  <line
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={y}
                    y2={y}
                    stroke="rgba(75, 85, 99, 0.3)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={margin.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                  >
                    {formatValue(Math.max(value, 0))}
                  </text>
                </g>
              );
            })}
          </g>

          <path
            d={areaPath}
            fill="url(#lineChartArea)"
            stroke="none"
          />

          <path
            d={linePath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {showDots && points.map((point) => (
            <g key={point.label}>
              <circle
                cx={point.x}
                cy={point.y}
                r={5}
                fill="#1E40AF"
                stroke="#60A5FA"
                strokeWidth={2}
              />
              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                className="text-xs fill-gray-300"
              >
                {formatValue(point.value)}
              </text>
            </g>
          ))}

          {points.map((point) => (
            <text
              key={`${point.label}-axis`}
              x={point.x}
              y={chartHeight - margin.bottom + 28}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              {point.label}
            </text>
          ))}

          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={margin.top + innerHeight}
            y2={margin.top + innerHeight}
            stroke="rgba(107, 114, 128, 0.6)"
          />
        </svg>
      </div>
    </div>
  );
}

