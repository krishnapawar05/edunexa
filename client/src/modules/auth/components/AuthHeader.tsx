import React from 'react';
import { AuthCrest } from './AuthCrest.js';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
  portalName?: string;
  badge?: string;
  showCrest?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title = 'Welcome Back',
  subtitle = 'Sign in to access your institutional account.',
  portalName,
  badge,
  showCrest = true,
}) => {
  const { branding } = useSchoolBranding();
  const displayPortalName = portalName || branding.schoolName || 'School ERP';

  return (
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      {showCrest && (
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
          <AuthCrest size={68} />
        </div>
      )}

      {badge && (
        <div style={{ marginBottom: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              backgroundColor: 'var(--primary-50, rgba(36, 76, 58, 0.08))',
              border: '1px solid var(--primary-200, rgba(36, 76, 58, 0.2))',
              borderRadius: '16px',
              color: 'var(--color-primary, #244c3a)',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {badge}
          </span>
        </div>
      )}

      <h2
        style={{
          margin: 0,
          fontSize: '1.45rem',
          fontWeight: 800,
          color: 'var(--text-primary, #242c27)',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
        }}
      >
        {displayPortalName}
      </h2>

      {title && title !== displayPortalName && (
        <h3
          style={{
            margin: '6px 0 0 0',
            fontSize: '1.10rem',
            fontWeight: 700,
            color: 'var(--color-primary, #244c3a)',
          }}
        >
          {title}
        </h3>
      )}

      {subtitle && (
        <p
          style={{
            margin: '6px 0 0 0',
            fontSize: '0.84rem',
            color: 'var(--text-secondary, #66716a)',
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
