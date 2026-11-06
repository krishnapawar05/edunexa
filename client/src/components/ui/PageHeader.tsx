import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: {
    label: string;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  };
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  primary: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  danger: 'bg-rose-100 text-rose-800 border-rose-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200 ${className}`}>
      <div className="space-y-1.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-emerald-700 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-600">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
              {icon}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          {badge && (
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                badgeVariants[badge.variant || 'primary']
              }`}
            >
              {badge.label}
            </span>
          )}
        </div>

        {subtitle && <p className="text-xs md:text-sm text-gray-500 max-w-3xl">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">{actions}</div>}
    </div>
  );
};

