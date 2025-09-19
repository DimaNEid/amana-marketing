interface BubbleMapDatum {
  id: string;
  label: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
  value: number;
  color?: string;
}

interface BubbleMapProps {
  title: string;
  metricLabel?: string;
  data: BubbleMapDatum[];
  className?: string;
  valueFormatter?: (value: number) => string;
  description?: string;
  height?: number;
}

const MAP_WIDTH = 900;
const MAP_HEIGHT = 460;
const MIN_RADIUS = 10;
const MAX_RADIUS = 50;
const DEFAULT_COLOR = '#38BDF8';

export function BubbleMap({
  title,
  metricLabel = 'Value',
  data,
  className = '',
  valueFormatter = (value) => value.toLocaleString(),
  description,
  height = MAP_HEIGHT,
}: BubbleMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg border border-gray-700 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-48 flex items-center justify-center text-gray-400">
          No regional data available
        </div>
      </div>
    );
  }

  const latitudes = data.map((item) => item.latitude);
  const longitudes = data.map((item) => item.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const latSpan = Math.max(maxLat - minLat, 0);
  const lonSpan = Math.max(maxLon - minLon, 0);

  const latPadding = Math.max(1, latSpan * 0.25);
  const lonPadding = Math.max(1, lonSpan * 0.25);

  const paddedLatMin = minLat - latPadding;
  const paddedLatMax = maxLat + latPadding;
  const paddedLonMin = minLon - lonPadding;
  const paddedLonMax = maxLon + lonPadding;

  const latRange = Math.max(paddedLatMax - paddedLatMin, 2);
  const lonRange = Math.max(paddedLonMax - paddedLonMin, 2);

  const margin = { top: 56, right: 56, bottom: 72, left: 72 };
  const innerWidth = MAP_WIDTH - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxValue = Math.max(...data.map((item) => item.value));
  const safeMaxValue = maxValue > 0 ? maxValue : 1;

  const points = data.map((item) => {
    const normalizedLon = (item.longitude - paddedLonMin) / lonRange;
    const normalizedLat = (item.latitude - paddedLatMin) / latRange;

    const x = margin.left + normalizedLon * innerWidth;
    const y = margin.top + (1 - normalizedLat) * innerHeight;

    const valueRatio = Math.sqrt(item.value / safeMaxValue);
    const radius = MIN_RADIUS + valueRatio * (MAX_RADIUS - MIN_RADIUS);

    return {
      ...item,
      x,
      y,
      radius,
    };
  });

  const tickRatios = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <span className="text-sm text-gray-400">{metricLabel}</span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${height}`}
          className="w-full min-w-full"
          role="img"
          aria-label={`${title} bubble map`}
        >
          <defs>
            <linearGradient id="bubbleMapBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(17, 24, 39, 0.95)" />
              <stop offset="100%" stopColor="rgba(17, 24, 39, 0.75)" />
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={MAP_WIDTH}
            height={height}
            fill="url(#bubbleMapBg)"
            rx={18}
          />

          <g opacity={0.4}>
            {tickRatios.map((ratio) => {
              const latValue = paddedLatMax - ratio * latRange;
              const y = margin.top + ratio * innerHeight;

              return (
                <g key={`lat-${ratio}`}>
                  <line
                    x1={margin.left}
                    x2={MAP_WIDTH - margin.right}
                    y1={y}
                    y2={y}
                    stroke="rgba(75, 85, 99, 0.35)"
                    strokeDasharray="6 6"
                  />
                  <text
                    x={margin.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] fill-gray-500"
                  >
                    {latValue.toFixed(1)} lat
                  </text>
                </g>
              );
            })}

            {tickRatios.map((ratio) => {
              const lonValue = paddedLonMin + ratio * lonRange;
              const x = margin.left + ratio * innerWidth;

              return (
                <g key={`lon-${ratio}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1={margin.top}
                    y2={height - margin.bottom}
                    stroke="rgba(75, 85, 99, 0.35)"
                    strokeDasharray="6 6"
                  />
                  <text
                    x={x}
                    y={height - margin.bottom + 32}
                    textAnchor="middle"
                    className="text-[11px] fill-gray-500"
                  >
                    {lonValue.toFixed(1)} lon
                  </text>
                </g>
              );
            })}
          </g>

          <rect
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="rgba(15, 23, 42, 0.35)"
            stroke="rgba(79, 70, 229, 0.25)"
            strokeWidth={1}
            rx={14}
          />

          {points.map((point) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.radius}
                fill={point.color ?? DEFAULT_COLOR}
                fillOpacity={0.45}
                stroke={point.color ?? DEFAULT_COLOR}
                strokeWidth={2}
              >
                <title>
                  {`${point.label}${point.subtitle ? `, ${point.subtitle}` : ''}: ${valueFormatter(point.value)}`}
                </title>
              </circle>

              <circle
                cx={point.x}
                cy={point.y}
                r={Math.max(point.radius * 0.65, point.radius - 8)}
                stroke="rgba(17, 24, 39, 0.9)"
                strokeWidth={1.5}
                fill="transparent"
              />

              <text
                x={point.x}
                y={point.y - point.radius - 14}
                textAnchor="middle"
                className="text-xs font-semibold fill-gray-100 drop-shadow"
              >
                {point.label}
              </text>

              {point.subtitle && (
                <text
                  x={point.x}
                  y={point.y - point.radius - 28}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-300"
                >
                  {point.subtitle}
                </text>
              )}

              <text
                x={point.x}
                y={point.y + point.radius + 16}
                textAnchor="middle"
                className="text-xs fill-gray-300"
              >
                {valueFormatter(point.value)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
