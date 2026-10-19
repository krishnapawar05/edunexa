import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext.js';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      mode: 'light',
      label: 'Light Mode',
      icon: <Sun size={15} style={{ color: '#f59e0b' }} />,
      desc: 'Crisp academic daylight styling',
    },
    {
      mode: 'dark',
      label: 'Dark Mode',
      icon: <Moon size={15} style={{ color: '#818cf8' }} />,
      desc: 'Refined midnight blue contrast',
    },
    {
      mode: 'system',
      label: 'System Preference',
      icon: <Laptop size={15} style={{ color: 'var(--text-muted)' }} />,
      desc: `Follows OS theme (${resolvedTheme === 'dark' ? 'Dark active' : 'Light active'})`,
    },
  ];

  const currentIcon = () => {
    if (theme === 'light') return <Sun size={16} style={{ color: '#f59e0b' }} />;
    if (theme === 'dark') return <Moon size={16} style={{ color: '#818cf8' }} />;
    return resolvedTheme === 'dark' ? (
      <Moon size={16} style={{ color: '#818cf8' }} />
    ) : (
      <Sun size={16} style={{ color: '#f59e0b' }} />
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ed-btn-icon"
        aria-label={`Current visual theme: ${theme} (${resolvedTheme} active). Click to select Light, Dark, or System.`}
        title={`Theme: ${theme === 'system' ? `System (${resolvedTheme})` : theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: compact ? '4px 8px' : '5px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {currentIcon()}
        {!compact && (
          <span style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'capitalize' }}>
            {theme === 'system' ? 'System' : theme}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            width: '210px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: 'var(--space-2)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '4px 8px 6px',
              fontSize: '0.70rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-default)',
              marginBottom: '4px',
            }}
          >
            Visual Interface Theme
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--primary-50)' : 'transparent',
                  color: isSelected ? 'var(--primary-700)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {opt.icon}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {opt.desc}
                    </div>
                  </div>
                </div>
                {isSelected && <Check size={14} style={{ color: 'var(--primary-600)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
