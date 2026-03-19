import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  onClick?: () => void;
}

const colorMap: Record<string, string> = {
  indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
  emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
  blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  violet: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30',
  amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
  rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30',
  sky: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30',
  orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'indigo',
  trend,
  trendLabel,
  onClick,
}: StatCardProps) {
  const iconColors = colorMap[color] ?? colorMap['indigo'];

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-3 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        {icon && (
          <div className={`p-2 rounded-xl ${iconColors}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-none">
          {value}
        </span>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-sm font-medium mb-0.5 ${
              trend === 'up'
                ? 'text-emerald-600 dark:text-emerald-400'
                : trend === 'down'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4" />}
            {trend === 'neutral' && <Minus className="w-4 h-4" />}
            {trendLabel}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}
