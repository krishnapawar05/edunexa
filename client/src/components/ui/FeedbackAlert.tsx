import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface FeedbackAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
  action?: React.ReactNode;
}

const styles = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />,
    closeBtn: 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100',
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />,
    closeBtn: 'text-rose-500 hover:text-rose-700 hover:bg-rose-100',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />,
    closeBtn: 'text-amber-500 hover:text-amber-700 hover:bg-amber-100',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />,
    closeBtn: 'text-blue-500 hover:text-blue-700 hover:bg-blue-100',
  },
};

export const FeedbackAlert: React.FC<FeedbackAlertProps> = ({
  type,
  title,
  message,
  onDismiss,
  className = '',
  action,
}) => {
  const current = styles[type] || styles.info;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${current.container} ${className}`}>
      {current.icon}
      <div className="flex-1 text-xs">
        {title && <h4 className="font-bold text-sm mb-0.5">{title}</h4>}
        <p className="leading-relaxed opacity-90">{message}</p>
        {action && <div className="mt-2.5">{action}</div>}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`p-1 rounded-lg transition-colors -mr-1 -mt-1 ${current.closeBtn}`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

