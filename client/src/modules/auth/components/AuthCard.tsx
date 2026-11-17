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
        border: '1px solid var(--border-default, #e2e6e0)',
        boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04)',
        padding: '36px 36px',
        position: 'relative',
        zIndex: 5,
        transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
