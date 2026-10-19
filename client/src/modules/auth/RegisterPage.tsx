import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { School, Building2, Mail, Phone, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';

export const RegisterPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    schoolName: '',
    code: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    city: '',
    state: '',
    board: 'CBSE',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div className="ed-card" style={{ width: '100%', maxWidth: '560px', backgroundColor: '#ffffff', padding: 'var(--space-6)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              backgroundColor: 'var(--primary-100)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-3)',
              color: 'var(--primary-700)',
            }}
          >
            <School size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem' }}>School Tenant Registration</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Register your institution for the EduNexa Advanced School Management & ERP System
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <CheckCircle2 size={50} style={{ color: 'var(--success-solid)', margin: '0 auto var(--space-3)' }} />
            <h3>Institutional Onboarding Initiated!</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>
              Thank you for registering <strong>{formData.schoolName}</strong>. Our Super Administration provisioning team has received your deployment application. A dedicated instance configuration link has been dispatched to <strong>{formData.adminEmail}</strong>.
            </p>
            <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <Link to="/" className="ed-btn ed-btn-secondary" style={{ textDecoration: 'none' }}>
                Return to Public Website
              </Link>
              <Link to="/login" className="ed-btn ed-btn-primary" style={{ textDecoration: 'none' }}>
                Go to Portal Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">School / Institution Name *</label>
              <input
                required
                className="ed-input"
                placeholder="e.g. Apex Global Academy"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Institution Code *</label>
                <input
                  required
                  className="ed-input"
                  placeholder="e.g. APEX-02"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Educational Board</label>
                <select
                  className="ed-select"
                  value={formData.board}
                  onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                >
                  <option value="CBSE">CBSE (Central Board)</option>
                  <option value="ICSE">ICSE / CISCE</option>
                  <option value="STATE">State Secondary Board</option>
                  <option value="IB">International Baccalaureate</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Primary Administrator Name *</label>
                <input
                  required
                  className="ed-input"
                  placeholder="e.g. Principal Dr. Raman"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                />
              </div>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Admin Phone *</label>
                <input
                  required
                  type="tel"
                  className="ed-input"
                  placeholder="+91 98000 00000"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Official Administrative Email *</label>
              <input
                required
                type="email"
                className="ed-input"
                placeholder="admin@institution.edu"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">City *</label>
                <input
                  required
                  className="ed-input"
                  placeholder="e.g. Bangalore"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">State / Province *</label>
                <input
                  required
                  className="ed-input"
                  placeholder="e.g. Karnataka"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-3)' }}>
              <button
                type="submit"
                className="ed-btn ed-btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.94rem', fontWeight: 600 }}
              >
                Submit Institutional Registration
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Already an onboarded institution? </span>
              <Link to="/login" style={{ color: 'var(--primary-700)', fontWeight: 600, textDecoration: 'none' }}>
                Log in to ERP Portal
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
