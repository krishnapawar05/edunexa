import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AuthBrandingPanel, AuthFeatureItem } from './AuthBrandingPanel.js';
import { AuthCard } from './AuthCard.js';
import { ThemeSwitcher } from '../../../components/ThemeSwitcher.js';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

interface AuthLayoutProps {
  leftHeading: string;
  leftTagline: string;
  leftFeatures: AuthFeatureItem[];
  imageSrc?: string;
  cardMaxWidth?: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  leftHeading,
  leftTagline,
  leftFeatures,
  imageSrc,
  cardMaxWidth = '480px',
  children,
}) => {
  const { branding } = useSchoolBranding();

  return (
    <div
      className="ed-auth-split-layout"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        backgroundColor: 'var(--bg-app, #f7f5ef)',
        color: 'var(--text-primary, #242c27)',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Floating Theme Switcher at Top-Right */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '18px',
          zIndex: 40,
        }}
      >
        <ThemeSwitcher compact={false} />
      </div>

      {/* LEFT SECTION: HIGH-RESOLUTION CAMPUS BRANDING PANEL (Desktop & Tablet) */}
      <AuthBrandingPanel
        heading={leftHeading}
        tagline={leftTagline}
        features={leftFeatures}
        imageSrc={imageSrc}
      />

      {/* RIGHT SECTION: FORM WORKSPACE & AUTH CARD */}
      <div
        className="ed-auth-form-panel"
        style={{
          flex: '1 1 48%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 24px',
          position: 'relative',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-app, #f7f5ef)',
        }}
      >
        {/* Soft Background Decorative Waves (Matches reference School ERP design aesthetic) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '100%',
              opacity: 0.45,
            }}
          >
            <path
              d="M300 0 C 450 200 650 350 1000 300 L 1000 0 Z"
              fill="var(--primary-100, rgba(36, 76, 58, 0.05))"
            />
            <path
              d="M100 0 C 350 300 550 500 1000 450 L 1000 0 Z"
              fill="var(--brand-gold-50, rgba(196, 164, 107, 0.04))"
            />
            <path
              d="M0 700 C 350 600 650 850 1000 750 L 1000 1000 L 0 1000 Z"
              fill="var(--primary-50, rgba(36, 76, 58, 0.04))"
            />
            <path
              d="M0 850 C 400 780 700 950 1000 880 L 1000 1000 L 0 1000 Z"
              fill="var(--brand-gold-100, rgba(196, 164, 107, 0.03))"
            />
          </svg>
        </div>

        {/* Mobile / Compact Top Brand Banner (visible only on smaller viewports where left panel is hidden) */}
        <div
          className="ed-auth-mobile-header"
          style={{
            display: 'none',
            width: '100%',
            maxWidth: cardMaxWidth,
            textAlign: 'center',
            marginBottom: '16px',
            position: 'relative',
            zIndex: 5,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              backgroundColor: 'var(--primary-50, rgba(36, 76, 58, 0.08))',
              border: '1px solid var(--primary-100, rgba(36, 76, 58, 0.16))',
              borderRadius: '24px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#c4a46b',
              }}
            />
            <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--color-primary, #244c3a)' }}>
              {branding.shortName || 'EduNexa'} School ERP
            </span>
          </div>
        </div>

        {/* Reusable Authentication Card */}
        <AuthCard maxWidth={cardMaxWidth}>
          {children}
        </AuthCard>
      </div>

      {/* Embedded Responsive Media Queries */}
      <style>{`
        @media (max-width: 960px) {
          .ed-auth-branding-panel {
            display: none !important;
          }
          .ed-auth-split-layout {
            flex-direction: column !important;
          }
          .ed-auth-form-panel {
            flex: 1 1 100% !important;
            padding: 48px 16px 28px !important;
          }
          .ed-auth-mobile-header {
            display: block !important;
          }
          .ed-auth-card {
            padding: 26px 20px !important;
            border-radius: 16px !important;
          }
        }
        @media (min-width: 961px) and (max-width: 1200px) {
          .ed-auth-branding-panel {
            padding: 36px 32px !important;
          }
          .ed-auth-branding-panel h1 {
            font-size: 2.1rem !important;
          }
          .ed-auth-form-panel {
            padding: 24px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};
