import React, { useState } from 'react';
import { BarChart3, AlertCircle } from 'lucide-react';

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface InteractiveChartProps {
  title?: string;
  subtitle?: string;
  type?: 'bar' | 'line' | 'area';
  data: ChartDataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  title,
  subtitle,
  type = 'bar',
  data = [],
  primaryLabel = 'Metric',
  secondaryLabel,
  primaryColor = '#10b981', // emerald-500
  secondaryColor = '#6366f1', // indigo-500
  height = 220,
  loading = false,
  emptyMessage = 'No chart data points recorded for this period.',
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${className}`}>
        {title && <div className="h-5 bg-gray-200 rounded w-36 mb-2 animate-pulse"></div>}
        <div style={{ height }} className="flex items-end gap-3 pt-6 animate-pulse">
          {[40, 65, 80, 50, 90, 70, 85].map((h, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-t" style={{ height: `${h}%` }}></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm ${className}`}>
        {title && <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>}
        {subtitle && <p className="text-xs text-gray-400 mb-6">{subtitle}</p>}
        <div style={{ height: height - 40 }} className="flex flex-col items-center justify-center text-gray-400">
          <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-xs">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue || 0)), 10);
  const chartPaddingTop = 20;
  const chartHeight = height - 50;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3 ${className}`}>
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          {title && <h3 className="font-bold text-gray-900 text-sm">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="text-gray-600 font-medium">{primaryLabel}</span>
          </div>
          {secondaryLabel && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
              <span className="text-gray-600 font-medium">{secondaryLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive SVG Chart Canvas */}
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 1000 ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = chartPaddingTop + (1 - pct) * (chartHeight - chartPaddingTop);
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1={y}
                  x2="1000"
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text x="0" y={y - 4} fontSize="18" fill="#94a3b8" className="select-none font-sans">
                  {Math.round(maxValue * pct)}
                </text>
              </g>
            );
          })}

          {/* Bar Chart Representation */}
          {type === 'bar' &&
            data.map((d, idx) => {
              const totalItems = data.length;
              const slotWidth = 1000 / totalItems;
              const barWidth = Math.max(12, slotWidth * 0.45);
              const barX = idx * slotWidth + slotWidth / 2 - barWidth / 2;

              const barHeight = ((d.value / maxValue) * (chartHeight - chartPaddingTop));
              const barY = chartHeight - barHeight;

              const isHovered = hoveredIndex === idx;

              return (
                <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    fill={primaryColor}
                    opacity={isHovered ? 1 : 0.85}
                    className="transition-all duration-150 cursor-pointer"
                  />
                  {d.secondaryValue !== undefined && (
                    <rect
                      x={barX + barWidth + 2}
                      y={chartHeight - ((d.secondaryValue / maxValue) * (chartHeight - chartPaddingTop))}
                      width={barWidth}
                      height={((d.secondaryValue / maxValue) * (chartHeight - chartPaddingTop))}
                      rx="4"
                      fill={secondaryColor}
                      opacity={isHovered ? 1 : 0.85}
                      className="transition-all duration-150 cursor-pointer"
                    />
                  )}
                </g>
              );
            })}

          {/* Line & Area Chart Representation */}
          {(type === 'line' || type === 'area') && (
            <>
              {/* Primary Line */}
              {type === 'area' && (
                <polygon
                  points={`0,${chartHeight} ${data
                    .map((d, i) => {
                      const x = (i / (data.length - 1 || 1)) * 1000;
                      const y = chartHeight - (d.value / maxValue) * (chartHeight - chartPaddingTop);
                      return `${x},${y}`;
                    })
                    .join(' ')} 1000,${chartHeight}`}
                  fill={primaryColor}
                  fillOpacity="0.12"
                />
              )}

              <polyline
                fill="none"
                stroke={primaryColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={data
                  .map((d, i) => {
                    const x = (i / (data.length - 1 || 1)) * 1000;
                    const y = chartHeight - (d.value / maxValue) * (chartHeight - chartPaddingTop);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {data.map((d, i) => {
                const x = (i / (data.length - 1 || 1)) * 1000;
                const y = chartHeight - (d.value / maxValue) * (chartHeight - chartPaddingTop);
                const isHovered = hoveredIndex === i;

                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={isHovered ? 7 : 4.5}
                    fill="#ffffff"
                    stroke={primaryColor}
                    strokeWidth={isHovered ? 3.5 : 2.5}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer transition-all duration-150"
                  />
                );
              })}
            </>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2 text-xs border border-gray-700 transition-all transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${((hoveredIndex + 0.5) / data.length) * 100}%`,
              top: '40%',
            }}
          >
            <div className="font-bold text-gray-200 border-b border-gray-700 pb-1 mb-1">
              {data[hoveredIndex].label}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span className="text-gray-300">{primaryLabel}:</span>
              <span className="font-bold">{data[hoveredIndex].value}</span>
            </div>
            {data[hoveredIndex].secondaryValue !== undefined && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <span className="text-gray-300">{secondaryLabel}:</span>
                <span className="font-bold">{data[hoveredIndex].secondaryValue}</span>
              </div>
            )}
          </div>
        )}

        {/* X-Axis Category Labels */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-400 pt-2 px-1">
          {data.map((d, idx) => (
            <div
              key={idx}
              className={`text-center truncate transition-colors ${
                hoveredIndex === idx ? 'font-bold text-emerald-700' : ''
              }`}
              style={{ width: `${100 / data.length}%` }}
            >
              {d.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

