import React from 'react';
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
  imageSrc = '/images/school/auth_campus_bg.jpg',
  cardMaxWidth = '490px',
  children,
}) => {
  const { branding } = useSchoolBranding();

  return (
    <div className="ed-auth-page-root">
      {/* 1. CONTINUOUS FULL-VIEWPORT BACKGROUND IMAGE LAYER (100vw x 100vh) */}
      <div
        className="ed-auth-bg-layer"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${imageSrc}")`,
        }}
      />

      {/* 2. INSTITUTIONAL FOREST GREEN OVERLAY LAYER */}
      <div
        className="ed-auth-overlay-layer"
        aria-hidden="true"
      />

      {/* 3. FLOATING THEME SWITCHER AT TOP-RIGHT */}
      <div className="ed-auth-theme-toggle">
        <ThemeSwitcher compact={false} />
      </div>

      {/* 4. FOREGROUND WORKSPACE & CONTENT CONTAINER */}
      <div className="ed-auth-content">
        <div className="ed-auth-container">
          {/* LEFT SECTION: BRANDING & HIGHLIGHTS (Over campus background) */}
          <div className="ed-auth-left-col">
            <AuthBrandingPanel
              heading={leftHeading}
              tagline={leftTagline}
              features={leftFeatures}
            />
          </div>

          {/* RIGHT SECTION: AUTHENTICATION CARD POSITIONED ON RIGHT */}
          <div className="ed-auth-right-col">
            {/* Mobile / Tablet Brand Pill (Visible on small screens where left panel is hidden) */}
            <div className="ed-auth-mobile-header">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.30)',
                  borderRadius: '24px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#c4a46b',
                    boxShadow: '0 0 8px rgba(196, 164, 107, 0.8)',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.01em',
                  }}
                >
                  {branding.shortName || 'EduNexa'} School ERP
                </span>
              </div>
            </div>

            {/* Elevated Auth Card */}
            <AuthCard maxWidth={cardMaxWidth}>
              {children}
            </AuthCard>
          </div>
        </div>
      </div>

      {/* EMBEDDED STYLES FOR FULL-SCREEN BACKGROUND & RESPONSIVE LAYOUT */}
      <style>{`
        /* ROOT PAGE CONTAINER */
        .ed-auth-page-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }

        /* 100vw x 100vh CONTINUOUS FULL-VIEWPORT CAMPUS BACKGROUND */
        .ed-auth-bg-layer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          z-index: 0;
          pointer-events: none;
        }

        /* FULL-SCREEN SUBTLE DARK FOREST GREEN OVERLAY */
        .ed-auth-overlay-layer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(
            135deg,
            rgba(12, 39, 29, 0.65) 0%,
            rgba(18, 50, 38, 0.52) 50%,
            rgba(9, 28, 20, 0.70) 100%
          );
          backdrop-filter: blur(1.5px);
          z-index: 1;
          pointer-events: none;
        }

        [data-theme='dark'] .ed-auth-overlay-layer,
        .dark .ed-auth-overlay-layer {
          background: linear-gradient(
            135deg,
            rgba(8, 24, 18, 0.78) 0%,
            rgba(12, 32, 24, 0.68) 50%,
            rgba(6, 18, 13, 0.84) 100%
          );
        }

        /* FLOATING THEME TOGGLE */
        .ed-auth-theme-toggle {
          position: fixed;
          top: 18px;
          right: 20px;
          z-index: 50;
        }

        /* FOREGROUND CONTENT WORKSPACE */
        .ed-auth-content {
          position: relative;
          z-index: 2;
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 44px 36px;
          box-sizing: border-box;
        }

        /* RESPONSIVE CONTAINER WITH DESKTOP 2-COLUMN ALIGNMENT */
        .ed-auth-container {
          width: 100%;
          max-width: 1380px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 52px;
          margin: auto 0;
        }

        /* LEFT COLUMN: BRANDING AND HIGHLIGHTS */
        .ed-auth-left-col {
          flex: 1 1 50%;
          max-width: 620px;
          display: flex;
          flex-direction: column;
        }

        /* RIGHT COLUMN: FOREGROUND AUTH CARD POSITIONED ON RIGHT */
        .ed-auth-right-col {
          flex: 1 1 50%;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
        }

        .ed-auth-mobile-header {
          display: none;
          width: 100%;
          text-align: center;
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 1140px) {
          .ed-auth-container {
            gap: 32px;
          }
          .ed-auth-left-col h1 {
            font-size: 2.2rem !important;
          }
        }

        @media (max-width: 980px) {
          .ed-auth-content {
            padding: 56px 20px 36px !important;
            align-items: flex-start !important;
          }
          .ed-auth-container {
            flex-direction: column !important;
            justify-content: center !important;
            gap: 0 !important;
          }
          .ed-auth-left-col {
            display: none !important;
          }
          .ed-auth-right-col {
            flex: 1 1 100% !important;
            width: 100% !important;
            align-items: center !important;
          }
          .ed-auth-mobile-header {
            display: block !important;
          }
        }

        @media (max-width: 540px) {
          .ed-auth-content {
            padding: 48px 14px 24px !important;
          }
          .ed-auth-card {
            padding: 24px 18px !important;
            border-radius: 16px !important;
          }
          .ed-auth-grid-2col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
