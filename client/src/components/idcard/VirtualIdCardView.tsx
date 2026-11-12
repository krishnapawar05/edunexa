import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Award,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export interface VirtualIdCardData {
  holderType: 'STUDENT' | 'TEACHER' | 'STAFF';
  fullName: string;
  identifier: string; // admissionNumber or employeeId
  className?: string | null;
  sectionName?: string | null;
  rollNumber?: string | number | null;
  designation?: string | null;
  department?: string | null;
  bloodGroup?: string | null;
  dateOfBirth?: string | null;
  joiningDate?: string | null;
  academicSession?: string | null;
  emergencyPhone?: string | null;
  avatarUrl?: string | null;
  cardNumber: string;
  verificationToken: string;
  status: string;
  schoolName?: string | null;
  schoolCode?: string | null;
  schoolAddress?: string | null;
  schoolPhone?: string | null;
  schoolEmail?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
}

interface VirtualIdCardViewProps {
  data: VirtualIdCardData;
  side: 'FRONT' | 'BACK';
  onScanVerify?: () => void;
  className?: string;
}

export const VirtualIdCardView: React.FC<VirtualIdCardViewProps> = ({
  data,
  side,
  onScanVerify,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const verificationUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify-id/${encodeURIComponent(data.verificationToken || '')}`
      : `https://edunexa.up.railway.app/verify-id/${encodeURIComponent(data.verificationToken || '')}`;

  useEffect(() => {
    let isMounted = true;
    if (data.verificationToken) {
      QRCode.toDataURL(verificationUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          if (isMounted) setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('[VirtualIdCardView] QR generation error:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [data.verificationToken, verificationUrl]);

  const isStudent = data.holderType === 'STUDENT';
  const schoolOfficialName = (data.schoolName || 'APEX ACADEMY OF SCIENCES & ARTS').toUpperCase();
  const schoolCodeShort = (data.schoolCode || 'APX').slice(0, 3).toUpperCase();
  const sessionLabel = data.academicSession || '2026–2027';
  const isActive = data.status === 'ACTIVE';

  // Format student Class & Section or Teacher Designation
  const studentClassSection =
    data.className && data.sectionName
      ? `${data.className} - ${data.sectionName}`
      : data.className || 'Senior Division';

  // Subtitle under school name
  const roleSubtitle = isStudent
    ? 'OFFICIAL STUDENT IDENTITY CREDENTIAL'
    : 'OFFICIAL FACULTY & TEACHING CREDENTIAL';

  return (
    <div
      className={`edunexa-cr80-card ${className}`}
      style={{
        width: '100%',
        maxWidth: '430px',
        aspectRatio: '85.6 / 53.98',
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        boxShadow: '0 12px 30px -8px rgba(18, 60, 46, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#0f172a',
      }}
    >
      {side === 'FRONT' ? (
        <>
          {/* ============================================================ */}
          {/* FRONT SIDE */}
          {/* ============================================================ */}

          {/* 1. Institutional Forest-Green Header */}
          <div
            style={{
              backgroundColor: '#123c2e', // Forest Green
              color: '#ffffff',
              padding: '9px 14px 7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
              <div
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#ffffff',
                  lineHeight: 1.2,
                }}
              >
                {schoolOfficialName}
              </div>
              <div
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  letterSpacing: '0.08em',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{roleSubtitle}</span>
                <span style={{ color: '#c59b27' }}>•</span>
                <span style={{ color: '#fef08a' }}>{sessionLabel}</span>
              </div>
            </div>

            {/* School Monogram / Crest Badge */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '2px solid #c59b27', // Subtle Gold Accent
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#123c2e',
                fontWeight: 900,
                fontSize: '0.82rem',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              {schoolCodeShort}
            </div>
          </div>

          {/* Gold Accent Divider */}
          <div
            style={{
              height: '3px',
              backgroundColor: '#c59b27', // Metallic Muted Gold
              width: '100%',
              flexShrink: 0,
            }}
          />

          {/* 2. Front Card Body: Photo (Left) + Details (Middle) + Dynamic QR (Right) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              gap: '12px',
              backgroundColor: '#ffffff',
              minHeight: 0,
            }}
          >
            {/* Standard 3:4 Passport Photograph Container */}
            <div
              style={{
                width: '78px',
                height: '98px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                border: '2px solid #123c2e', // Forest green border
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 2px 6px rgba(18, 60, 46, 0.12)',
              }}
            >
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt={data.fullName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    backgroundColor: '#e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#123c2e' }}>
                    {data.fullName.charAt(0) || (isStudent ? 'S' : 'F')}
                  </span>
                  <span
                    style={{
                      fontSize: '0.48rem',
                      fontWeight: 700,
                      color: '#64748b',
                      marginTop: '2px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isStudent ? 'STUDENT' : 'FACULTY'}
                  </span>
                </div>
              )}
            </div>

            {/* Holder Identity Details (Aligned grid) */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '2.5px',
              }}
            >
              {/* Full Name */}
              <div
                style={{
                  fontSize: '0.96rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {data.fullName}
              </div>

              {/* Role Sub-title */}
              {isStudent ? (
                <div
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#123c2e',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {studentClassSection}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#123c2e',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {data.designation || 'Academic Faculty'}
                </div>
              )}

              {/* Data Fields */}
              <div
                style={{
                  fontSize: '0.67rem',
                  color: '#334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  marginTop: '1px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>{isStudent ? 'Adm No: ' : 'Emp ID: '}</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{data.identifier}</strong>
                </div>

                {isStudent ? (
                  <>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span>
                        <span style={{ color: '#64748b' }}>Roll: </span>
                        <strong>{data.rollNumber ?? '—'}</strong>
                      </span>
                      {data.bloodGroup && (
                        <span>
                          <span style={{ color: '#64748b' }}>Blood: </span>
                          <strong style={{ color: '#b91c1c' }}>{data.bloodGroup}</strong>
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span style={{ color: '#64748b' }}>Dept: </span>
                      <strong>{data.department || 'Academic Affairs'}</strong>
                    </div>
                  </>
                )}

                {/* Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isActive ? '#16a34a' : '#dc2626',
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: isActive ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {isActive ? (isStudent ? 'Active Enrolled' : 'Active Permanent') : data.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Scannable QR Code Box (Right Side) */}
            <div
              onClick={() => {
                if (onScanVerify) {
                  onScanVerify();
                } else {
                  window.open(verificationUrl, '_blank');
                }
              }}
              title="Click to view public verification record"
              style={{
                width: '64px',
                height: '76px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '3px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                transition: 'transform 0.15s ease',
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Dynamic QR Code"
                  style={{
                    width: '54px',
                    height: '54px',
                    display: 'block',
                    imageRendering: 'pixelated',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.5rem',
                    color: '#64748b',
                  }}
                >
                  QR Code
                </div>
              )}
              <span
                style={{
                  fontSize: '0.46rem',
                  fontWeight: 800,
                  color: '#123c2e',
                  letterSpacing: '0.04em',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                SCAN VERIFY
              </span>
            </div>
          </div>

          {/* 3. Front Footer Bar */}
          <div
            style={{
              padding: '5px 14px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.60rem',
              color: '#64748b',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Card No:</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{data.cardNumber}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#123c2e', fontWeight: 700 }}>ISO CR80 TAMPER-PROOF</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span>Valid: <strong>03/2027</strong></span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ============================================================ */}
          {/* BACK SIDE (Clean, Professional, Structured) */}
          {/* ============================================================ */}

          {/* Top Forest Green Header Strip */}
          <div
            style={{
              backgroundColor: '#123c2e',
              height: '6px',
              width: '100%',
              flexShrink: 0,
            }}
          />

          <div
            style={{
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Back Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#123c2e',
                  letterSpacing: '0.05em',
                }}
              >
                {isStudent
                  ? 'STUDENT VERIFICATION & INSTITUTIONAL RECORD'
                  : 'FACULTY VERIFICATION & INSTITUTIONAL RECORD'}
              </div>
            </div>

            {/* Institutional Coordinates Grid */}
            <div
              style={{
                fontSize: '0.62rem',
                color: '#334155',
                lineHeight: 1.45,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                marginTop: '2px',
              }}
            >
              <div>
                <strong>Campus:</strong> {data.schoolAddress || 'Plot 42, Institutional Area, Knowledge Park III'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span>
                  <strong>Phone:</strong> {data.schoolPhone || '+91 11 2659 1000'}
                </span>
                <span>
                  <strong>Email:</strong> {data.schoolEmail || 'admin@apexacademy.edu'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#b91c1c' }}>
                  {isStudent ? 'Emergency / Parent Contact: ' : 'Emergency Contact: '}
                </strong>
                <span style={{ fontWeight: 600 }}>{data.emergencyPhone || '+91 98100 23456'}</span>
              </div>
            </div>

            {/* Official Usage Instructions & Security Notice */}
            <div
              style={{
                fontSize: '0.54rem',
                color: '#475569',
                lineHeight: 1.35,
                backgroundColor: '#f8fafc',
                padding: '5px 8px',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                margin: '3px 0',
              }}
            >
              <div>
                • This card is institutional property and must be carried at all times on campus premises.
              </div>
              <div>
                • Authorized for campus entry, library access, and examination verification.
              </div>
              <div>
                • If found, return to the School Administration Office or notify campus security immediately.
              </div>
            </div>

            {/* Signatures & Seal Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '2px',
                marginTop: 'auto',
              }}
            >
              {/* Official Seal Placeholder / Stamp */}
              <div
                style={{
                  width: '62px',
                  height: '28px',
                  border: '1.5px dashed #c59b27', // Gold dashed border
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fffdf5',
                }}
              >
                <span style={{ fontSize: '0.46rem', fontWeight: 800, color: '#123c2e', letterSpacing: '0.04em' }}>
                  OFFICIAL SEAL
                </span>
                <span style={{ fontSize: '0.38rem', color: '#c59b27', fontWeight: 700 }}>
                  EDUNEXA VERIFIED
                </span>
              </div>

              {/* Principal Signature Area */}
              <div style={{ textAlign: 'right', minWidth: '100px' }}>
                <div
                  style={{
                    fontFamily: 'serif',
                    fontStyle: 'italic',
                    fontSize: '0.72rem',
                    color: '#123c2e',
                    fontWeight: 700,
                    marginBottom: '-1px',
                  }}
                >
                  Principal Signature
                </div>
                <div style={{ width: '100%', height: '1px', backgroundColor: '#334155' }} />
                <div style={{ fontSize: '0.50rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  Principal / Registrar
                </div>
              </div>
            </div>

            {/* Bottom Verification URL & Token Bar */}
            <div
              style={{
                fontSize: '0.52rem',
                color: '#64748b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '3px',
                marginTop: '3px',
              }}
            >
              <span>Token: <strong style={{ fontFamily: 'monospace' }}>{data.verificationToken || 'v-tok-live'}</strong></span>
              <span>Web: <strong>edunexa.up.railway.app/verify-id</strong></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
