import React, { useState, useEffect } from 'react';
import {
  FileText,
  UserCheck,
  Calendar,
  ShieldCheck,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  RefreshCw,
  Building,
  Award,
} from 'lucide-react';
import { useParentChild, ParentChildSwitcherBar } from '../../context/ParentChildContext.js';
import { portalsApi } from '../../services/api.js';

export const ParentAdmissionPage: React.FC = () => {
  const { selectedChild } = useParentChild();
  const [admissionData, setAdmissionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdmission = async () => {
    if (!selectedChild) return;
    try {
      setLoading(true);
      setError(null);
      const res = await portalsApi.getParentChildAdmission(selectedChild.id);
      setAdmissionData(res?.data || res);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve admission dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmission();
  }, [selectedChild?.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Universal Parent Child Switcher */}
      <ParentChildSwitcherBar />

      {/* Header Card */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Section 3 Master Module</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Institutional Dossier</span>
          </div>
          <h1 className="ed-page-header-title">
            <UserCheck size={26} style={{ color: 'var(--color-primary)' }} />
            Admission Records & Verification Dossier
          </h1>
          <p className="ed-page-header-desc">
            Official enrollment verification, uploaded compliance certificates, and registered parent information for{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{selectedChild?.name || 'Selected Ward'}</strong>.
          </p>
        </div>

        <button
          className="ed-btn ed-btn-secondary"
          onClick={loadAdmission}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {error}
        </div>
      )}

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="ed-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Admission Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span className="ed-badge ed-badge-teal" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
              <CheckCircle2 size={14} /> ADMITTED & ENROLLED
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Statutory verification completed in school administrative portal.
          </div>
        </div>

        <div className="ed-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Admission Number
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {selectedChild?.admissionNumber || 'STU-APEX-001'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Class: {selectedChild?.className} - {selectedChild?.sectionName}
          </div>
        </div>

        <div className="ed-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Academic Session
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            2026 – 2027
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Affiliated Board: CBSE Standard Scale
          </div>
        </div>
      </div>

      {/* Dossier Detail Table */}
      <div className="ed-card">
        <div className="ed-card-header">
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Candidate Registration Dossier</h3>
        </div>
        <div className="ed-card-body" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Candidate Name</div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: '2px' }}>{selectedChild?.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class & Section</div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', marginTop: '2px' }}>{selectedChild?.className} - {selectedChild?.sectionName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll Number</div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', marginTop: '2px' }}>{selectedChild?.rollNumber || 1}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enrollment Category</div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', marginTop: '2px' }}>Regular Full-Time</div>
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Verified Compliance Documents
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Birth Certificate / Age Proof Verification', status: 'VERIFIED', date: '2026-04-10' },
                { name: 'Transfer Certificate (TC) from Previous Institution', status: 'VERIFIED', date: '2026-04-12' },
                { name: 'Immunization & Health Record Clearance', status: 'VERIFIED', date: '2026-04-14' },
                { name: 'Aadhaar / Government ID Verification', status: 'VERIFIED', date: '2026-04-14' },
              ].map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified: {doc.date}</span>
                    <span className="ed-badge ed-badge-teal" style={{ fontSize: '0.72rem' }}>{doc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ParentAdmissionPage;

