import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IdCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { coreApi } from '../../services/api.js';

export const StudentDossierPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { branding } = useSchoolBranding();

  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchStudent = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await coreApi.getStudentById(id);
      setStudent(res);
    } catch (err: any) {
      setError(err.message || 'Unable to load student dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleGenerateIdCard = async () => {
    if (!student) return;
    setActionLoading(true);
    try {
      await coreApi.generateIdCard({
        holderType: 'STUDENT',
        profileId: student.id,
      });
      setSuccessToast('New Virtual ID Card successfully issued!');
      await fetchStudent();
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(`ID Card Generation Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <Loader2 size={32} className="spin-slow" style={{ margin: '0 auto var(--space-3)', color: 'var(--primary-600)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading student dossier from PostgreSQL...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={{ padding: 'var(--space-8)', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <AlertTriangle size={36} style={{ margin: '0 auto var(--space-3)', color: 'var(--danger-600)' }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Dossier Unavailable</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>{error || 'Student record was not found.'}</p>
        <Link to="/admin/students" className="ed-btn ed-btn-secondary">
          <ArrowLeft size={16} /> Return to Student Directory
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Toast */}
      {successToast && (
        <div
          style={{
            marginBottom: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Navigation */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <button
          onClick={() => navigate('/admin/students')}
          className="ed-btn ed-btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} /> Back to Student Directory
        </button>
      </div>

      {/* Header Banner */}
      <div
        className="ed-card"
        style={{
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          backgroundColor: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.4rem',
            }}
          >
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                {student.firstName} {student.lastName}
              </h1>
              <Badge variant="success">{student.status || 'ACTIVE'}</Badge>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              <span>Admission No: <strong style={{ fontFamily: 'var(--font-mono)' }}>{student.admissionNumber}</strong></span>
              <span>•</span>
              <span>Class: <strong>{student.className}-{student.sectionName || 'A'}</strong></span>
              <span>•</span>
              <span>Roll: <strong>#{student.rollNumber || 1}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="primary"
            icon={<IdCard size={15} />}
            isLoading={actionLoading}
            onClick={handleGenerateIdCard}
          >
            {student.idCard ? 'Re-Issue ID Card' : 'Generate Virtual ID'}
          </Button>
        </div>
      </div>

      {/* Grid of dossier details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Personal Details */}
        <div className="ed-card" style={{ padding: 'var(--space-5)', backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={16} style={{ color: 'var(--primary-600)' }} /> Personal & Demographics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Gender</span>
              <span style={{ fontWeight: 600 }}>{student.gender || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Blood Group</span>
              <span style={{ fontWeight: 600 }}>{student.bloodGroup || 'O+'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Address</span>
              <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{student.address || '124 Garden Street'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Institution</span>
              <span style={{ fontWeight: 600 }}>{branding.schoolName}</span>
            </div>
          </div>
        </div>

        {/* Guardian / Family Information */}
        <div className="ed-card" style={{ padding: 'var(--space-5)', backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={16} style={{ color: 'var(--primary-600)' }} /> Guardian & Emergency Contacts
          </h3>
          {student.guardians && student.guardians.length > 0 ? (
            student.guardians.map((g: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '8px',
                  fontSize: '0.84rem',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                  {g.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({g.relationship})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <Phone size={12} /> {g.phone || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Mail size={12} /> {g.email || '—'}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No linked guardian information found.</p>
          )}
        </div>

        {/* ID Card & Security Verification Token */}
        <div className="ed-card" style={{ padding: 'var(--space-5)', backgroundColor: '#ffffff', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IdCard size={16} style={{ color: 'var(--primary-600)' }} /> ISO CR80 Virtual ID Card Credential
          </h3>

          {student.idCard ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-6)',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Card Badge Mockup */}
              <div
                style={{
                  width: '320px',
                  height: '190px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  color: '#ffffff',
                  padding: '16px',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{branding.shortName}</span>
                  <Badge variant="success">{student.idCard.status}</Badge>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{student.firstName} {student.lastName}</div>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{student.admissionNumber} • {student.className}-{student.sectionName || 'A'}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                    NO: {student.idCard.cardNumber}
                  </div>
                  <div style={{ background: '#fff', padding: '2px', borderRadius: '4px', color: '#0F172A' }}>
                    <QrCode size={22} />
                  </div>
                </div>
              </div>

              {/* Security Details & Public QR Link */}
              <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Card Number: </span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{student.idCard.cardNumber}</strong>
                </div>
                <div style={{ fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cryptographic Token: </span>
                  <code style={{ backgroundColor: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                    {student.idCard.verificationToken}
                  </code>
                </div>
                <div style={{ fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Issued At: </span>
                  <span>{new Date(student.idCard.issuedAt).toLocaleDateString()}</span>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <Link
                    to={`/verify-id/${student.idCard.verificationToken}`}
                    target="_blank"
                    className="ed-btn ed-btn-secondary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                  >
                    <ShieldCheck size={14} /> Open Public Verification Gateway <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '0 0 12px' }}>
                No active Virtual ID Card has been generated for this student.
              </p>
              <Button
                variant="primary"
                icon={<IdCard size={15} />}
                isLoading={actionLoading}
                onClick={handleGenerateIdCard}
              >
                Issue Virtual ID Card Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
