import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, School } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (role: string) => void;
  onGoToPublic: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToPublic }) => {
  const [email, setEmail] = useState('admin@apexacademy.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState('SCHOOL_ADMIN');
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    { role: 'SUPER_ADMIN', label: 'Platform Super Admin', email: 'superadmin@edunexa.org', badge: 'Multi-Tenant' },
    { role: 'SCHOOL_ADMIN', label: 'School Admin / Principal', email: 'admin@apexacademy.edu', badge: 'Apex Academy' },
    { role: 'TEACHER', label: 'Physics Teacher', email: 'dr.thorne@apexacademy.edu', badge: 'Grade 10' },
    { role: 'STUDENT', label: 'Student Profile', email: 'aarav.sharma@student.apex.edu', badge: 'Grade 10-A' },
  ];

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setSelectedRole(acc.role);
    setEmail(acc.email);
    setPassword('DemoPass2026!');
    setErrorMessage(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Authentication failed. Please check credentials.');
      }

      // Store verified token and session
      localStorage.setItem('edunexa_access_token', data.data.accessToken);
      localStorage.setItem('edunexa_user', JSON.stringify(data.data.user));

      onLoginSuccess(data.data.user.role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Banner */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'var(--primary-700)',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.4rem',
              marginBottom: 'var(--space-3)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            E
          </div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>EduNexa Institutional Portal</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Unified Academic & Administrative ERP Access
          </p>
        </div>

        {/* Demo Fast-Switcher Card */}
        <div
          className="ed-card"
          style={{
            marginBottom: 'var(--space-4)',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-default)',
            padding: 'var(--space-3) var(--space-4)',
          }}
        >
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>One-Click Role Demonstration</span>
            <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Synthetic Sandbox</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {demoAccounts.map((acc) => {
              const isSelected = selectedRole === acc.role;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--primary-600)' : '1px solid var(--border-default)',
                    backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-subtle)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: isSelected ? 'var(--primary-700)' : 'var(--text-primary)',
                    }}
                  >
                    {acc.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{acc.badge}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <div className="ed-card ed-card-body" style={{ backgroundColor: '#ffffff', boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleFormSubmit}>
            <div className="ed-input-group">
              <label className="ed-label">Institutional Email</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
                />
                <input
                  required
                  type="email"
                  className="ed-input"
                  style={{ paddingLeft: '34px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="ed-input-group">
              <label className="ed-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
                />
                <input
                  required
                  type="password"
                  className="ed-input"
                  style={{ paddingLeft: '34px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', fontSize: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Remember terminal session
              </label>
              <a href="#reset" onClick={(e) => e.preventDefault()} style={{ fontSize: '0.78rem' }}>
                Forgot Password?
              </a>
            </div>

            {errorMessage && (
              <div
                style={{
                  marginBottom: 'var(--space-4)',
                  padding: '8px 12px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger-text)',
                  fontSize: '0.82rem',
                }}
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="ed-btn ed-btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '0.95rem' }}
            >
              {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Public Website Backlink */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <button
            onClick={onGoToPublic}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Return to Public School Website
          </button>
        </div>
      </div>
    </div>
  );
};
