import React, { useState, useEffect } from 'react';
import {
  IdCard,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Download,
  ShieldCheck,
  Building,
  Calendar,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { idCardsApi } from '../../services/api.js';
import { downloadIndividualIdCardPdf, IdCardRenderData } from '../../utils/idCardPdf.js';

export const TeacherVirtualIdCardPage: React.FC = () => {
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cardSide, setCardSide] = useState<'FRONT' | 'BACK'>('FRONT');

  const loadTeacherCard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await idCardsApi.getMyIdCard();
      const data = (res as any).data || res;
      setCardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employee virtual ID credential.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherCard();
  }, []);

  const handleDownloadPdf = () => {
    if (!cardData) return;
    const renderPayload: IdCardRenderData = {
      holderType: 'TEACHER',
      fullName: cardData.fullName,
      identifier: cardData.employeeId,
      subDetail: `${cardData.department} • ${cardData.designation}`,
      joiningDate: cardData.joiningDate,
      emergencyPhone: cardData.emergencyPhone,
      cardNumber: cardData.idCard?.cardNumber || 'CR80-PENDING',
      verificationToken: cardData.idCard?.verificationToken || 'N/A',
      status: cardData.idCard?.status || 'ACTIVE',
      schoolName: cardData.school?.name,
      schoolCode: cardData.school?.code,
      schoolAddress: cardData.school?.address,
      schoolPhone: cardData.school?.phone,
      schoolEmail: cardData.school?.email,
    };
    downloadIndividualIdCardPdf(renderPayload, cardData.idCard?.template || {});
  };

  const cardStatus = cardData?.idCard?.status || 'ACTIVE';
  const verificationToken = cardData?.idCard?.verificationToken || '';

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
              My Faculty Identity Card
            </h2>
            <span
              className={`ed-badge ${cardStatus === 'ACTIVE' ? 'ed-badge-success' : 'ed-badge-danger'}`}
              style={{ fontSize: '0.72rem' }}
            >
              {cardStatus}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Official institutional teaching faculty digital credential with verifiable QR authentication.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadTeacherCard}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Credential
          </button>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={handleDownloadPdf}
            disabled={!cardData}
          >
            <Download size={14} /> Download PDF
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.7fr', gap: 'var(--space-6)' }}>
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

          <div
            className="ed-card-body"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 'var(--space-6)',
              backgroundColor: 'var(--bg-subtle)',
            }}
          >
            {/* The ISO CR80 Smart Card Box */}
            <div
              style={{
                width: '360px',
                height: '228px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {cardSide === 'FRONT' ? (
                <>
                  {/* Front: Navy Header */}
                  <div
                    style={{
                      backgroundColor: cardData?.idCard?.template?.primaryColor || '#1e3a8a',
                      color: '#ffffff',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: `3px solid ${cardData?.idCard?.template?.secondaryColor || '#d97706'}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                        {cardData?.school?.name?.toUpperCase() || 'APEX ACADEMY OF EXCELLENCE'}
                      </div>
                      <div style={{ fontSize: '0.62rem', opacity: 0.9, letterSpacing: '0.05em' }}>
                        FACULTY IDENTITY CREDENTIAL
                      </div>
                    </div>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1e3a8a',
                        fontWeight: 900,
                        fontSize: '0.78rem',
                      }}
                    >
                      APX
                    </div>
                  </div>

                  {/* Front Body */}
                  <div style={{ display: 'flex', padding: '12px 14px', gap: '14px', flex: 1 }}>
                    {/* Photo Box */}
                    <div
                      style={{
                        width: '74px',
                        height: '92px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        border: '2px solid #1e3a8a',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a' }}>
                        {cardData?.fullName?.charAt(0) || 'F'}
                      </span>
                      <span style={{ fontSize: '0.52rem', color: '#64748b', marginTop: '4px' }}>FACULTY</span>
                    </div>

                    {/* Holder Info */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                        {cardData?.fullName || 'Dr. Alistair Thorne'}
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#1e3a8a' }}>
                        {cardData?.designation || 'Senior Faculty'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#475569' }}>
                        Dept: <strong>{cardData?.department || 'Science & Mathematics'}</strong>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#475569' }}>
                        Emp ID: <strong>{cardData?.employeeId || 'EMP-2026-001'}</strong>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#475569' }}>
                        Status: <span style={{ color: '#16a34a', fontWeight: 700 }}>● Active Permanent</span>
                      </div>
                    </div>
                  </div>

                  {/* Front Footer */}
                  <div
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#f8fafc',
                      borderTop: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.62rem',
                      color: '#64748b',
                    }}
                  >
                    <span>Card No: {cardData?.idCard?.cardNumber || 'CR80-2026-9041'}</span>
                    <span style={{ color: '#1e3a8a', fontWeight: 600 }}>ISO CR80 TAMPER-PROOF</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Back: Details & Seal */}
                  <div
                    style={{
                      height: '6px',
                      backgroundColor: cardData?.idCard?.template?.primaryColor || '#1e3a8a',
                    }}
                  />
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#1e3a8a', textAlign: 'center' }}>
                      FACULTY VERIFICATION & CONTACT
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#334155', lineHeight: 1.4 }}>
                      <strong>Campus:</strong> {cardData?.school?.address || 'Plot 42, Knowledge Park III, Bengaluru'}
                      <br />
                      <strong>Phone:</strong> {cardData?.school?.phone || '+91 80 4968 2000'} | <strong>Email:</strong> {cardData?.school?.email || 'admin@apexacademy.edu'}
                      <br />
                      <strong>Emergency Phone:</strong> {cardData?.emergencyPhone || '+91 98450 12345'}
                    </div>

                    <div
                      style={{
                        fontSize: '0.56rem',
                        color: '#64748b',
                        lineHeight: 1.3,
                        backgroundColor: '#f8fafc',
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        marginTop: '2px',
                      }}
                    >
                      {cardData?.idCard?.template?.customTermsText ||
                        'This card is institutional property. Unauthorized duplication or transfer is prohibited. Return if found to school administration.'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '24px',
                          border: '1px dashed #94a3b8',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.48rem',
                          color: '#94a3b8',
                        }}
                      >
                        OFFICIAL SEAL
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ width: '80px', borderBottom: '1px solid #334155', marginBottom: '2px' }} />
                        <div style={{ fontSize: '0.52rem', fontWeight: 700, color: '#0f172a' }}>Principal / Registrar</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.54rem', color: '#94a3b8', textAlign: 'center', paddingBottom: '4px' }}>
                    Token: {verificationToken || 'v-tok-demo'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Security Verification & QR Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#16a34a" />
              Cryptographic Credential Verification
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Your faculty card is encoded with an HMAC SHA-256 verification token linked directly to the institutional PostgreSQL ledger.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.80rem',
                marginBottom: '16px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Card Number: </span>
                <strong>{cardData?.idCard?.cardNumber || 'CR80-2026-9041'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>● {cardStatus}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Issued Date: </span>
                <strong>{cardData?.idCard?.issuedAt ? new Date(cardData.idCard.issuedAt).toLocaleDateString() : 'Active'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Expires: </span>
                <strong>{cardData?.idCard?.expiresAt ? new Date(cardData.idCard.expiresAt).toLocaleDateString() : 'Annual Renewal'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={`/verify-id/${verificationToken}`}
                target="_blank"
                rel="noreferrer"
                className="ed-btn ed-btn-secondary"
                style={{ fontSize: '0.80rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <ExternalLink size={14} />
                Open Public QR Verification Link
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

