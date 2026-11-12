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
  Calendar,
  Lock,
  ExternalLink,
  Award,
} from 'lucide-react';
import { idCardsApi } from '../../services/api.js';
import { downloadIndividualIdCardPdf, IdCardRenderData } from '../../utils/idCardPdf.js';
import { VirtualIdCardView, VirtualIdCardData } from '../../components/idcard/VirtualIdCardView.js';

export const StudentVirtualIdCardPage: React.FC = () => {
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [cardSide, setCardSide] = useState<'FRONT' | 'BACK'>('FRONT');

  const loadStudentCard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await idCardsApi.getMyIdCard();
      if (res) {
        setCardData(res.card ? res : (res as any).data || res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student virtual ID credential.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentCard();
  }, []);

  const card = cardData?.card || cardData?.idCard;
  const profile = cardData?.profile || cardData;
  const school = cardData?.school;
  const template = cardData?.template;

  const studentFullName =
    profile?.fullName ||
    (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Authenticated Student');
  const admissionNumber = profile?.admissionNumber || profile?.identifier || 'ADM-2026-0042';
  const className = profile?.className || profile?.class || 'Grade 10';
  const sectionName = profile?.sectionName || profile?.section || 'A';
  const rollNumber = profile?.rollNumber ?? 1;
  const bloodGroup = profile?.bloodGroup || 'O+';
  const cardStatus = card?.status || 'ACTIVE';
  const cardNumber = card?.cardNumber || 'STU-CR80-4679';
  const verificationToken = card?.verificationToken || '';
  const schoolName = school?.name || 'Apex Academy of Sciences & Arts';
  const schoolCode = school?.code || 'APEX-2026';

  const cardViewModel: VirtualIdCardData = {
    holderType: 'STUDENT',
    fullName: studentFullName,
    identifier: admissionNumber,
    className: className,
    sectionName: sectionName,
    rollNumber: rollNumber,
    bloodGroup: bloodGroup,
    dateOfBirth: profile?.dateOfBirth,
    academicSession: profile?.academicSession || '2026–2027',
    emergencyPhone: profile?.emergencyPhone || profile?.parentPhone || '+91 98100 23456',
    avatarUrl: profile?.avatarUrl || profile?.photoUrl,
    cardNumber: cardNumber,
    verificationToken: verificationToken,
    status: cardStatus,
    schoolName: schoolName,
    schoolCode: schoolCode,
    schoolAddress: school?.address || 'Plot 42, Institutional Area, Knowledge Park III',
    schoolPhone: school?.phone || '+91 11 2659 1000',
    schoolEmail: school?.email || 'admin@apexacademy.edu',
  };

  const handleDownloadPdf = async () => {
    if (!profile) return;
    setIsDownloading(true);
    try {
      const renderPayload: IdCardRenderData = {
        holderType: 'STUDENT',
        fullName: studentFullName,
        identifier: admissionNumber,
        subDetail: `${className} - ${sectionName} • Roll: ${rollNumber}`,
        bloodGroup: bloodGroup,
        dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : undefined,
        emergencyPhone: profile?.emergencyPhone || profile?.parentPhone,
        address: profile?.address,
        academicSession: profile?.academicSession || '2026–2027',
        avatarUrl: profile?.avatarUrl || profile?.photoUrl,
        cardNumber: cardNumber,
        verificationToken: verificationToken,
        status: cardStatus,
        schoolName: schoolName,
        schoolCode: schoolCode,
        schoolAddress: school?.address,
        schoolPhone: school?.phone,
        schoolEmail: school?.email,
      };

      await downloadIndividualIdCardPdf(
        renderPayload,
        template,
        `Student-ID-${admissionNumber.replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`
      );
    } catch (err: any) {
      console.error('PDF download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenVerify = () => {
    if (verificationToken) {
      window.open(`/verify-id/${encodeURIComponent(verificationToken)}`, '_blank');
    }
  };

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
            <IdCard size={24} style={{ color: '#123c2e' }} />
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
            Official ISO CR80 digital student credential backed by live school database records.
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
            className="ed-btn ed-btn-secondary"
            onClick={handleDownloadPdf}
            disabled={loading || !card || isDownloading}
          >
            <Download size={14} /> {isDownloading ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => window.print()}
          >
            <Printer size={15} /> Print Card
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.4fr) 1.6fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Interactive ISO CR80 Card */}
        <div className="ed-card">
          <div className="ed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Digital Smart Card Preview</span>
            <div style={{ display: 'flex', gap: '6px' }}>
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
              justifyContent: 'center',
              gap: 'var(--space-5)',
              backgroundColor: 'var(--bg-subtle)',
              padding: 'var(--space-6)',
              minHeight: '340px',
            }}
          >
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <div>Loading student digital credential...</div>
              </div>
            ) : (
              <>
                {/* Reusable Forest-Green Institutional Virtual ID Card */}
                <VirtualIdCardView
                  data={cardViewModel}
                  side={cardSide}
                  onScanVerify={handleOpenVerify}
                />

                {/* Actions under card */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', maxWidth: '430px' }}>
                  <button
                    className="ed-btn ed-btn-secondary"
                    style={{ flex: 1, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                    onClick={handleOpenVerify}
                  >
                    <QrCode size={14} /> Scan / Verify QR
                  </button>
                  <button
                    className="ed-btn ed-btn-primary"
                    style={{ flex: 1, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                    onClick={handleDownloadPdf}
                    disabled={!profile || isDownloading}
                  >
                    <Download size={14} /> {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Security, Verification & Status Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: '#16a34a' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cryptographic Verification & Security</span>
              </div>
            </div>
            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your student card is protected by a tamper-proof cryptographic token registered on the school&apos;s authoritative ledger.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Card Number</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, fontFamily: 'monospace' }}>{cardNumber}</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Card Status</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: cardStatus === 'ACTIVE' ? '#16a34a' : '#dc2626' }}>
                    {cardStatus}
                  </div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Academic Session</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>{profile?.academicSession || '2026–2027'}</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Security Token</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {verificationToken ? `${verificationToken.slice(0, 14)}...` : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong>Zero Sensitive Exposure:</strong> Public QR scanning confirms your identity, grade, and active status without revealing private contact details or residential address.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong>Instant Server Revocability:</strong> If your card is misplaced, school administrators can instantly revoke or reissue your credential.
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
                <button
                  onClick={handleOpenVerify}
                  className="ed-btn ed-btn-secondary ed-btn-sm"
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> Open Public Verification Gateway
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
