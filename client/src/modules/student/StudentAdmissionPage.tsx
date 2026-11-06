import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  User,
  GraduationCap,
  Calendar,
  CheckCircle2,
  FileText,
  Shield,
  Download,
  AlertTriangle,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { portalsApi } from '../../services/api.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';

export const StudentAdmissionPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await portalsApi.getStudentAdmissionDetails();
      setData(res);
    } catch (err) {
      console.error('Failed to load admission details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header Banner */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Registrar & Admissions</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Institutional Student Dossier</span>
          </div>
          <h1 className="ed-page-header-title">
            <FileCheck size={26} style={{ color: 'var(--color-primary)' }} />
            Official Admission Records & Verification Dossier
          </h1>
          <p className="ed-page-header-desc">
            Verified institutional enrollment details, statutory admission registration number, enrolled cohort, and uploaded document verification ledger.
          </p>
        </div>

        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="ed-card" style={{ padding: '64px', textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px auto' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading verified admission records...</p>
        </div>
      ) : !data ? (
        <div className="ed-card" style={{ padding: '48px', textAlign: 'center' }}>
          <AlertTriangle size={36} style={{ color: '#d97706', margin: '0 auto 12px auto' }} />
          <p style={{ fontWeight: 600 }}>Admission records not found for this account.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Card 1: Official Admission Registration */}
          <div className="ed-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Enrolled Academic Profile</h2>
              </div>
              <Badge variant="success">Confirmed & Verified</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Admission Number:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                  {data.admissionNumber}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Academic Session:</span>
                <span style={{ fontWeight: 600 }}>{data.academicSession}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Enrolled Class & Section:</span>
                <span style={{ fontWeight: 600 }}>{data.className} - {data.sectionName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Assigned Roll Number:</span>
                <span style={{ fontWeight: 600 }}>#{data.rollNumber}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Admission Date:</span>
                <span>{new Date(data.admittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Blood Group:</span>
                <span>{data.bloodGroup || 'Not specified'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gender:</span>
                <span>{data.gender || 'Not specified'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Emergency Contact:</span>
                <span style={{ fontFamily: 'monospace' }}>{data.emergencyPhone}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Submitted Documents & Verification Status */}
          <div className="ed-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: '#2563eb' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Statutory Documents Ledger</h2>
              </div>
              <span className="ed-badge ed-badge-neutral">{data.documents?.length || 0} Files</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.documents?.map((doc: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle, #f7f9f6)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Verified by Registrar Office • {new Date(doc.uploadedAt || data.admittedAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <Badge variant="success">Verified</Badge>
                </div>
              ))}
            </div>

            {/* Guardian Contacts */}
            {data.parents && data.parents.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                  Linked Guardian Information
                </h3>
                {data.parents.map((p: any, idx: number) => (
                  <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.fullName}</strong> ({p.relationship}) {p.isPrimary && <span className="ed-badge ed-badge-teal" style={{ marginLeft: '4px' }}>Primary</span>}
                    </div>
                    {p.email && <div>Email: {p.email}</div>}
                    {p.phone && <div>Phone: {p.phone}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

