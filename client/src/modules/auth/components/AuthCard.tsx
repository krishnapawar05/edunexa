import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  maxWidth = '460px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`ed-auth-card ${className}`}
      style={{
        width: '100%',
        maxWidth,
        backgroundColor: 'var(--bg-surface, #ffffff)',
        borderRadius: '20px',
        border: '1px solid var(--border-default, rgba(36, 76, 58, 0.14))',
        boxShadow:
          '0 24px 50px -12px rgba(0, 0, 0, 0.38), 0 6px 20px rgba(0, 0, 0, 0.14)',
        padding: '30px 32px',
        position: 'relative',
        zIndex: 5,
        transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
