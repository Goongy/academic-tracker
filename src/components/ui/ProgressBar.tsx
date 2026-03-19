interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  label?: string;
  showLabel?: boolean;
  height?: 'xs' | 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const heightMap = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export default function ProgressBar({
  value,
  color = 'bg-indigo-500',
  label,
  showLabel = false,
  height = 'md',
  animated = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {clamped.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ${heightMap[height]}`}
      >
        <div
          className={`${heightMap[height]} ${color} rounded-full transition-all duration-500 ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
