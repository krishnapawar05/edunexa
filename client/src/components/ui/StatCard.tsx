import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  color?: 'emerald' | 'purple' | 'blue' | 'amber' | 'rose' | 'indigo' | 'cyan';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorStyles = {
  emerald: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  purple: {
    bg: 'bg-purple-50 text-purple-700 border-purple-100',
    iconBg: 'bg-purple-100 text-purple-800',
    badge: 'bg-purple-100 text-purple-800',
  },
  blue: {
    bg: 'bg-blue-50 text-blue-700 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-800',
    badge: 'bg-blue-100 text-blue-800',
  },
  amber: {
    bg: 'bg-amber-50 text-amber-700 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-800',
    badge: 'bg-amber-100 text-amber-800',
  },
  rose: {
    bg: 'bg-rose-50 text-rose-700 border-rose-100',
    iconBg: 'bg-rose-100 text-rose-800',
    badge: 'bg-rose-100 text-rose-800',
  },
  indigo: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    iconBg: 'bg-indigo-100 text-indigo-800',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  cyan: {
    bg: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    iconBg: 'bg-cyan-100 text-cyan-800',
    badge: 'bg-cyan-100 text-cyan-800',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'emerald',
  loading = false,
  onClick,
  className = '',
}) => {
  const scheme = colorStyles[color] || colorStyles.emerald;

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-20 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200/90 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-gray-300' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${scheme.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-gray-900">{value}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              trend.isPositive === true
                ? 'bg-emerald-100 text-emerald-800'
                : trend.isPositive === false
                ? 'bg-rose-100 text-rose-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {trend.isPositive === true && <TrendingUp className="w-3 h-3" />}
            {trend.isPositive === false && <TrendingDown className="w-3 h-3" />}
            {trend.isPositive === undefined && <Minus className="w-3 h-3" />}
            {trend.value}
          </span>
        )}
      </div>

      {(subtitle || trend?.label) && (
        <p className="text-xs text-gray-400 mt-1.5 truncate">
          {trend?.label ? `${trend.label} • ` : ''}
          {subtitle}
        </p>
      )}
    </div>
  );
};

