import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AuthFooterLinkItem {
  textBefore?: string;
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'muted';
}

interface AuthFooterProps {
  links?: AuthFooterLinkItem[];
  onGoToPublic?: () => void;
  showPublicLink?: boolean;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({
  links = [],
  onGoToPublic,
  showPublicLink = true,
}) => {
  return (
    <div
      style={{
        marginTop: '22px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        fontSize: '0.82rem',
      }}
    >
      {/* Action / Secondary Links */}
      {links.map((link, idx) => (
        <div key={idx} style={{ color: 'var(--text-secondary, #66716a)' }}>
          {link.textBefore && <span>{link.textBefore} </span>}
          {link.to ? (
            <Link
              to={link.to}
              style={{
                color: link.variant === 'muted' ? 'var(--text-secondary, #66716a)' : 'var(--color-primary, #244c3a)',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {link.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={link.onClick}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: link.variant === 'muted' ? 'var(--text-secondary, #66716a)' : 'var(--color-primary, #244c3a)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.82rem',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {link.label}
            </button>
          )}
        </div>
      ))}

      {/* Return to Public Website */}
      {showPublicLink && (
        <div style={{ marginTop: '4px', borderTop: '1px solid var(--border-subtle, #ebefe9)', paddingTop: '10px' }}>
          {onGoToPublic ? (
            <button
              type="button"
              onClick={onGoToPublic}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--text-muted, #8a968f)',
                fontSize: '0.80rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={13} />
              Return to Public School Website
            </button>
          ) : (
            <Link
              to="/"
              style={{
                color: 'var(--text-muted, #8a968f)',
                fontSize: '0.80rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={13} />
              Return to Public School Website
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
