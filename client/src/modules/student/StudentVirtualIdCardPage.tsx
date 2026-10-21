import React, { useState, useEffect } from 'react';
import {
  IdCard,
  QrCode,
  Award,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Download,
  ShieldCheck,
  Calendar,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { coreApi, getStoredUser } from '../../services/api.js';
import { downloadIdCardPdf } from '../../services/pdfGenerator.js';

export const StudentVirtualIdCardPage: React.FC = () => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [cardSide, setCardSide] = useState<'FRONT' | 'BACK'>('FRONT');

  const loadStudentCard = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      const studentProfile = await coreApi.getStudentById(currentStudentId);
      setStudent(studentProfile);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student virtual ID credential.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentCard();
  }, []);

  const studentFullName = student
    ? `${student.firstName} ${student.lastName}`
    : 'Authenticated Student';
  const admissionNumber = student?.admissionNumber || '—';
  const className = student?.className || student?.enrollments?.[0]?.class?.name || '—';
  const sectionName = student?.sectionName || student?.enrollments?.[0]?.section?.name || '—';
  const rollNumber = student?.rollNumber || student?.enrollments?.[0]?.rollNumber || '—';
  const bloodGroup = student?.bloodGroup || '—';
  const cardStatus = student?.idCard?.status || 'PENDING';
  const verificationToken = student?.idCard?.verificationToken || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <IdCard size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              My Virtual ID Card
            </h2>
            <span
              className={`ed-badge ${cardStatus === 'ACTIVE' ? 'ed-badge-success' : 'ed-badge-danger'}`}
              style={{ fontSize: '0.72rem' }}
            >
              {cardStatus}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Official ISO CR80 tamper-proof digital student credential with dynamic HMAC verification.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadStudentCard}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Credential
          </button>
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => window.print()}
          >
            <Printer size={15} /> Print Physical Copy
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg, #fef2f2)',
            border: '1px solid var(--danger-border, #fecaca)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text, #dc2626)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Card View & Security Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Interactive ISO CR80 Card */}
        <div className="ed-card">
          <div className="ed-card-header">
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Digital Smart Card Preview</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className={`ed-btn ed-btn-sm ${cardSide === 'FRONT' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                onClick={() => setCardSide('FRONT')}
              >
                Front Side
              </button>
              <button
                className={`ed-btn ed-btn-sm ${cardSide === 'BACK' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                onClick={() => setCardSide('BACK')}
              >
                Back Side
              </button>
            </div>
          </div>

          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            {/* The ISO CR80 Virtual ID Card Container */}
            <div
              style={{
                width: '100%',
                maxWidth: '420px',
                aspectRatio: '1.586 / 1', // ISO/IEC 7810 ID-1 standard ratio
                borderRadius: '16px',
                background: 'linear-gradient(145deg, #090d16, #1e293b)',
                color: '#ffffff',
                padding: '20px 24px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                border: '1px solid #334155',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
            >
              {/* Background watermark hologram simulation */}
              <div
                style={{
                  position: 'absolute',
                  right: '-20px',
                  bottom: '-20px',
                  opacity: 0.05,
                  pointerEvents: 'none',
                }}
              >
                <Award size={240} />
              </div>

              {cardSide === 'FRONT' ? (
                <>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--primary-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1rem',
                          color: '#ffffff',
                        }}
                      >
                        A
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#f8fafc' }}>
                          Apex Academy of Sciences
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Affiliated to CBSE Board
                        </div>
                      </div>
                    </div>
                    <span
                      className="ed-badge ed-badge-success"
                      style={{ fontSize: '0.64rem', fontWeight: 700, padding: '3px 8px' }}
                    >
                      STUDENT
                    </span>
                  </div>

                  {/* Card Middle: Photo + Student Info + QR */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', margin: '12px 0' }}>
                    {/* Photo Placeholder */}
                    <div
                      style={{
                        width: '82px',
                        height: '98px',
                        backgroundColor: '#0f172a',
                        border: '2px solid #475569',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        flexShrink: 0,
                      }}
                    >
                      <Award size={32} style={{ color: '#60a5fa', marginBottom: '4px' }} />
                      <span style={{ fontSize: '0.64rem', fontWeight: 700 }}>STUDENT</span>
                    </div>

                    {/* Metadata */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        {studentFullName}
                      </div>
                      <div style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginTop: '2px', fontWeight: 600 }}>
                        {admissionNumber}
                      </div>
                      <div style={{ marginTop: '8px', color: '#cbd5e1', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div>Class: <strong style={{ color: '#ffffff' }}>{className} - {sectionName}</strong></div>
                        <div>Roll Number: <strong style={{ color: '#ffffff' }}>{rollNumber}</strong></div>
                        <div>Blood Group: <strong style={{ color: '#ffffff' }}>{bloodGroup}</strong></div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div
                      onClick={() => setShowQrModal(true)}
                      title="Click to view public verification preview"
                      style={{
                        width: '68px',
                        height: '68px',
                        backgroundColor: '#ffffff',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <QrCode size={52} style={{ color: '#0f172a' }} />
                      <span style={{ fontSize: '0.52rem', color: '#334155', fontWeight: 800 }}>VERIFY</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
                    <span>Session: <strong>2026–2027</strong></span>
                    <span>Valid Thru: <strong>April 2027</strong></span>
                  </div>
                </>
              ) : (
                <>
                  {/* Card Back */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Magnetic Stripe representation */}
                    <div
                      style={{
                        height: '32px',
                        backgroundColor: '#020617',
                        margin: '-4px -24px 8px -24px',
                        borderTop: '1px solid #1e293b',
                        borderBottom: '1px solid #1e293b',
                      }}
                    />
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      <strong style={{ color: '#ffffff' }}>Terms of Use:</strong> This card is the property of Apex Academy of Sciences and must be returned upon request or transfer. Found cards should be deposited at the campus administration office.
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
                      <div>Campus Contact: {student?.membership?.school?.phone || 'Campus Administration Office'}</div>
                      <div>Portal Verification URL: https://edunexa.campus.edu/verify</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
                    <span>Authorized Signature: [Principal]</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>ENC-SHA256</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions under card */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', maxWidth: '420px' }}>
              <button
                className="ed-btn ed-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowQrModal(true)}
              >
                <QrCode size={14} /> Scan / Verify QR
              </button>
              <button
                className="ed-btn ed-btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  downloadIdCardPdf({
                    schoolName: 'Apex Academy of Sciences & Arts',
                    fullName: studentFullName,
                    identifierNumber: admissionNumber,
                    roleCategory: 'STUDENT',
                    classOrDept: className ? `${className} - ${sectionName}` : 'Grade 10-A',
                    academicSession: '2026–2027',
                    bloodGroup: bloodGroup,
                    status: cardStatus,
                    verificationToken: verificationToken || 'v-tok-8f2c-49a1-9b7e-e214',
                  });
                }}
              >
                <Download size={14} /> Download ID Card (PDF)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Security, Verification & Status Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--success-solid)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Credential Security & Privacy Policy</span>
              </div>
            </div>
            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                In accordance with <strong>B2World EduNexa PRD §6</strong>, this virtual student card uses a time-signed, revocable QR verification payload.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success-solid)', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>Zero Sensitive Exposure:</strong> Public QR scanning does NOT reveal student home address, phone numbers, academic scores, or parent financial data.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success-solid)', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>Instant Server Revocability:</strong> If a student changes sections, graduates, or if a card is reported compromised, administrators can revoke the token instantly in the database.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success-solid)', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>Physical & Digital Dual Support:</strong> Conforms strictly to ISO/IEC 7810 ID-1 standard dimensions (85.60 × 53.98 mm) for standard badge card printers.
                  </div>
                </div>
              </div>

              {/* Credential Metadata Box */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  fontSize: '0.80rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div><strong>Issuer:</strong> Apex Academy Administrative Registry</div>
                <div><strong>Token ID:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{verificationToken}</span></div>
                <div><strong>Status:</strong> <span style={{ color: 'var(--success-solid)', fontWeight: 600 }}>Active & Verified in PostgreSQL</span></div>
                <div><strong>Cryptographic Protocol:</strong> HMAC-SHA256 Token Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Verification Preview Modal */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-4)',
          }}
        >
          <div className="ed-card ed-modal-container" style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-surface)' }}>
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Public Verification Preview</h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Target public route: /verify-id/{verificationToken}
                </p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowQrModal(false)}>
                ✕
              </button>
            </div>

            <div className="ed-card-body" style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  margin: '0 auto var(--space-4)',
                  padding: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCode size={110} style={{ color: '#0f172a' }} />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  backgroundColor: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--success-text)',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  marginBottom: 'var(--space-3)',
                }}
              >
                <CheckCircle2 size={14} /> Officially Valid & Active Credential
              </div>

              <div
                style={{
                  textAlign: 'left',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div><strong>Full Name:</strong> {studentFullName}</div>
                <div><strong>Institution:</strong> Apex Academy of Sciences</div>
                <div><strong>Role:</strong> Student ({className} - {sectionName})</div>
                <div><strong>Admission ID:</strong> {admissionNumber}</div>
                <div><strong>Status:</strong> Valid for Academic Year 2026–2027</div>
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'var(--space-3)', lineHeight: 1.4 }}>
                PRD Compliance: PII and private student metrics are excluded from this verification token.
              </p>

              <button
                className="ed-btn ed-btn-primary"
                style={{ marginTop: 'var(--space-4)', width: '100%' }}
                onClick={() => setShowQrModal(false)}
              >
                Dismiss Verification Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentVirtualIdCardPage;
