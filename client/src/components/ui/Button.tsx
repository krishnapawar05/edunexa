import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'ed-btn ed-btn-primary';
      case 'secondary':
        return 'ed-btn ed-btn-secondary';
      case 'danger':
        return 'ed-btn ed-btn-danger';
      case 'ghost':
        return 'ed-btn-icon';
      case 'outline':
        return 'ed-btn ed-btn-secondary';
      default:
        return 'ed-btn ed-btn-primary';
    }
  };

  const getSizeStyle = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '5px 10px', fontSize: '0.80rem' };
      case 'lg':
        return { padding: '10px 18px', fontSize: '0.95rem' };
      default:
        return {};
    }
  };

  return (
    <button
      className={`${getVariantClass()} ${className}`}
      disabled={disabled || isLoading}
      style={{
        ...getSizeStyle(),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
