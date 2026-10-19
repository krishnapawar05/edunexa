import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home, Shield } from 'lucide-react';
import { useSchoolBranding } from '../context/SchoolBrandingContext.js';
import { getStoredUser } from '../services/api.js';

export const NotFoundPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const navigate = useNavigate();
  const user = getStoredUser();

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'SUPER_ADMIN':
        return '/superadmin';
      case 'SCHOOL_ADMIN':
        return '/admin';
      case 'TEACHER':
        return '/teacher';
      case 'STUDENT':
        return '/student';
      case 'PARENT':
        return '/parent';
      case 'EXAM_COORDINATOR':
        return '/examinations';
      case 'HR_STAFF':
        return '/hr';
      case 'ACCOUNTS':
        return '/accounts';
      default:
        return '/admin';
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
        textAlign: 'center',
      }}
    >
      <div
        className="ed-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--warning-50, #fef3c7)',
            color: 'var(--warning-600, #d97706)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Compass size={32} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
          404: Page Not Found
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: 'var(--space-6)' }}>
          The requested route or institutional resource does not exist or has been relocated within {branding.schoolName}.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            className="ed-btn ed-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          <Link
            to="/"
            className="ed-btn ed-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <Home size={16} /> Public Website
          </Link>

          <Link
            to={getDashboardLink()}
            className="ed-btn ed-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <Shield size={16} /> ERP Workspace
          </Link>
        </div>
      </div>
    </div>
  );
};
