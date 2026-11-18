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
}) => {
  const { branding } = useSchoolBranding();

  return (
    <div
      className="ed-auth-branding-panel"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '16px 0',
        color: '#ffffff',
        background: 'transparent',
      }}
    >
      {/* TOP BRANDING BAR */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '4px',
              height: '42px',
              backgroundColor: '#c4a46b',
              borderRadius: '4px',
              boxShadow: '0 0 14px rgba(196, 164, 107, 0.8)',
            }}
          />
          <div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.55)',
              }}
            >
              {branding.shortName || 'School ERP'}
            </div>
            <div
              style={{
                fontSize: '0.84rem',
                color: 'rgba(255, 255, 255, 0.88)',
                fontWeight: 500,
                marginTop: '3px',
                letterSpacing: '0.02em',
                textShadow: '0 1px 6px rgba(0, 0, 0, 0.45)',
              }}
            >
              Institutional ERP & AI Management Suite
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE HEADLINE & TAGLINE */}
      <div style={{ margin: '34px 0', maxWidth: '560px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '5px 14px',
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          }}
        >
          Institutional Excellence
        </span>

        <h1
          style={{
            fontSize: '2.6rem',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            margin: '0 0 16px 0',
            textShadow: '0 2px 14px rgba(0, 0, 0, 0.6)',
          }}
        >
          {heading}
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'rgba(247, 245, 239, 0.94)',
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 400,
            textShadow: '0 1px 8px rgba(0, 0, 0, 0.5)',
          }}
        >
          {tagline}
        </p>
      </div>

      {/* BOTTOM FEATURE HIGHLIGHTS */}
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(features.length, 4)}, 1fr)`,
            gap: '12px',
            maxWidth: '580px',
          }}
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.24)',
                  borderRadius: '12px',
                  padding: '14px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(196, 164, 107, 0.32)',
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
                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.45)',
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
