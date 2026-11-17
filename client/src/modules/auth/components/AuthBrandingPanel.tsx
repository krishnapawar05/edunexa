import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export interface AuthFeatureItem {
  icon: LucideIcon;
  label: string;
}

interface AuthBrandingPanelProps {
  heading: string;
  tagline: string;
  features: AuthFeatureItem[];
  imageSrc?: string;
}

export const AuthBrandingPanel: React.FC<AuthBrandingPanelProps> = ({
  heading,
  tagline,
  features,
  imageSrc = '/images/school/auth_campus_bg.jpg',
}) => {
  const { branding } = useSchoolBranding();

  return (
    <div
      className="ed-auth-branding-panel"
      style={{
        flex: '1 1 52%',
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
        overflow: 'hidden',
        backgroundImage: `url("${imageSrc}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* High-legibility Multi-stop Forest Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(20, 42, 33, 0.86) 0%, rgba(36, 76, 58, 0.65) 45%, rgba(16, 35, 26, 0.92) 100%)',
          backdropFilter: 'blur(1px)',
          zIndex: 1,
        }}
      />

      {/* TOP BRANDING BAR */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '4px',
              height: '42px',
              backgroundColor: '#c4a46b',
              borderRadius: '4px',
              boxShadow: '0 0 12px rgba(196, 164, 107, 0.6)',
            }}
          />
          <div>
            <div
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
              }}
            >
              {branding.shortName || 'School ERP'}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: 500,
                marginTop: '2px',
                letterSpacing: '0.02em',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              Institutional ERP & AI Management Suite
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE HEADLINE & TAGLINE */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '560px',
          margin: '40px 0',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '5px 12px',
            backgroundColor: 'rgba(196, 164, 107, 0.22)',
            border: '1px solid rgba(196, 164, 107, 0.45)',
            borderRadius: '20px',
            color: '#fdfaf5',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px',
            backdropFilter: 'blur(8px)',
          }}
        >
          Institutional Excellence
        </span>

        <h1
          style={{
            fontSize: '2.55rem',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            margin: '0 0 14px 0',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.45)',
          }}
        >
          {heading}
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'rgba(247, 245, 239, 0.92)',
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 400,
            textShadow: '0 1px 6px rgba(0, 0, 0, 0.35)',
          }}
        >
          {tagline}
        </p>
      </div>

      {/* BOTTOM FEATURE HIGHLIGHTS */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(features.length, 4)}, 1fr)`,
            gap: '12px',
            maxWidth: '620px',
          }}
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(196, 164, 107, 0.30)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: '8px',
                  }}
                >
                  <Icon size={18} />
                </div>
                <div
                  style={{
                    color: '#ffffff',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    lineHeight: 1.25,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {feat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
