import { useMemo, useState } from 'react';
import type { Assignment } from '../../types';
import { formatDate } from '../../utils/calculations';

interface GradeChartProps {
  assignments: Assignment[];
  width?: number;
  height?: number;
}

interface DataPoint {
  date: string;
  pct: number;
  name: string;
  category: string;
}

export default function GradeChart({
  assignments,
  width = 600,
  height = 200,
}: GradeChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);

  const points = useMemo<DataPoint[]>(() => {
    return assignments
      .filter(
        a =>
          a.status === 'graded' &&
          a.gradeReceived !== null &&
          a.dueDate !== null
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .map(a => ({
        date: a.dueDate!,
        pct: (a.gradeReceived! / a.totalPossible) * 100,
        name: a.name,
        category: a.category,
      }));
  }, [assignments]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
        No graded assignments yet
      </div>
    );
  }

  if (points.length === 1) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
        Grade trend will appear when more assignments are graded
      </div>
    );
  }

  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const minY = Math.max(0, Math.min(...points.map(p => p.pct)) - 10);
  const maxY = Math.min(105, Math.max(...points.map(p => p.pct)) + 5);

  const toX = (i: number) => padLeft + (i / (points.length - 1)) * chartWidth;
  const toY = (pct: number) =>
    padTop + chartHeight - ((pct - minY) / (maxY - minY)) * chartHeight;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.pct).toFixed(1)}`)
    .join(' ');

  const areaD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${(padTop + chartHeight).toFixed(1)} L ${toX(0).toFixed(1)} ${(padTop + chartHeight).toFixed(1)} Z`;

  // 90% threshold line
  const y90 = toY(90);
  const showThreshold = 90 >= minY && 90 <= maxY;

  // Y-axis ticks
  const yTicks = [minY, (minY + maxY) / 2, maxY].map(v => Math.round(v));

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: '300px' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {yTicks.map(tick => (
          <g key={tick}>
            <line
              x1={padLeft}
              y1={toY(tick)}
              x2={padLeft + chartWidth}
              y2={toY(tick)}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
              className="text-gray-400"
            />
            <text
              x={padLeft - 6}
              y={toY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              className="fill-gray-400 dark:fill-gray-500"
            >
              {tick}%
            </text>
          </g>
        ))}

        {/* 90% A threshold line */}
        {showThreshold && (
          <g>
            <line
              x1={padLeft}
              y1={y90}
              x2={padLeft + chartWidth}
              y2={y90}
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.6}
            />
            <text
              x={padLeft + chartWidth + 4}
              y={y90}
              dominantBaseline="middle"
              fontSize={9}
              fill="#10b981"
              opacity={0.8}
            >
              A
            </text>
          </g>
        )}

        {/* Area fill */}
        <path d={areaD} fill="url(#gradeGradient)" opacity={0.15} />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Hover zone */}
            <circle
              cx={toX(i)}
              cy={toY(p.pct)}
              r={14}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => {
                setTooltip({
                  x: toX(i),
                  y: toY(p.pct),
                  point: p,
                });
              }}
            />
            {/* Visible dot */}
            <circle
              cx={toX(i)}
              cy={toY(p.pct)}
              r={4}
              fill={p.pct >= 90 ? '#10b981' : p.pct >= 80 ? '#6366f1' : p.pct >= 70 ? '#f59e0b' : '#ef4444'}
              stroke="white"
              strokeWidth={2}
              className="pointer-events-none"
            />
          </g>
        ))}

        {/* X-axis dates — show first, last, and middle if ≥ 3 points */}
        {[0, Math.floor((points.length - 1) / 2), points.length - 1]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map(i => (
            <text
              key={i}
              x={toX(i)}
              y={padTop + chartHeight + 16}
              textAnchor="middle"
              fontSize={10}
              className="fill-gray-400 dark:fill-gray-500"
            >
              {formatDate(points[i].date)}
            </text>
          ))}

        {/* Tooltip */}
        {tooltip && (() => {
          const tx = tooltip.x;
          const ty = tooltip.y;
          const boxW = 130;
          const boxH = 54;
          const boxX = tx + boxW + 10 > width ? tx - boxW - 6 : tx + 6;
          const boxY = ty - boxH / 2;
          return (
            <g>
              <rect
                x={boxX}
                y={boxY}
                width={boxW}
                height={boxH}
                rx={6}
                className="fill-gray-900 dark:fill-gray-100"
                opacity={0.9}
              />
              <text
                x={boxX + 8}
                y={boxY + 16}
                fontSize={9}
                className="fill-gray-300 dark:fill-gray-600"
              >
                {formatDate(tooltip.point.date)}
              </text>
              <text
                x={boxX + 8}
                y={boxY + 29}
                fontSize={10}
                fontWeight="600"
                className="fill-white dark:fill-gray-900"
              >
                {tooltip.point.pct.toFixed(1)}%
              </text>
              <text
                x={boxX + 8}
                y={boxY + 44}
                fontSize={9}
                className="fill-gray-300 dark:fill-gray-600"
              >
                {tooltip.point.name.length > 18
                  ? tooltip.point.name.slice(0, 16) + '…'
                  : tooltip.point.name}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
