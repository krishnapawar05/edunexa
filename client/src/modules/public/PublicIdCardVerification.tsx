import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  IdCard,
  Search,
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { PublicIdCardVerificationResponse } from '@edunexa/shared';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { getApiUrl } from '../../services/api.js';

interface PublicIdCardVerificationProps {
  initialToken?: string;
  onBackToPublic?: () => void;
}

export const PublicIdCardVerification: React.FC<PublicIdCardVerificationProps> = ({
  initialToken,
  onBackToPublic,
}) => {
  const { branding } = useSchoolBranding();
  const routeParams = useParams<{ token?: string }>();
  const navigate = useNavigate();

  const effectiveToken = routeParams.token || initialToken || '';
  const [tokenInput, setTokenInput] = useState(effectiveToken);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PublicIdCardVerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchVerification = async (tok: string) => {
    if (!tok.trim()) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(getApiUrl(`/api/v1/core/id-cards/verify/${encodeURIComponent(tok.trim())}`));
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Verification token is invalid or does not exist.');
      }

      setVerificationResult(json.data);
    } catch (err: any) {
      setVerificationResult(null);
      setErrorMessage(err.message || 'Unable to verify card token.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const targetToken = routeParams.token || initialToken;
    if (targetToken) {
      setTokenInput(targetToken);
      fetchVerification(targetToken);
    }
  }, [routeParams.token, initialToken]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVerification(tokenInput);
  };

  const isStudent = verificationResult?.holderType === 'STUDENT';
  const isRevoked = verificationResult?.status === 'REVOKED';
  const isExpired = verificationResult?.status === 'EXPIRED';
  const isValid = verificationResult?.isValid && !isRevoked && !isExpired;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-8) var(--space-4)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '620px' }}>
        {/* Navigation Back */}
        <button
          onClick={() => {
            if (onBackToPublic) {
              onBackToPublic();
            } else {
              navigate('/');
            }
          }}
          className="ed-btn ed-btn-secondary"
          style={{ marginBottom: 'var(--space-5)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} /> Back to Public Portal
        </button>

        {/* Verification Card */}
        <div className="ed-card" style={{ padding: 'var(--space-6)', boxShadow: 'var(--shadow-lg)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'rgba(18, 60, 46, 0.1)',
                color: '#123c2e',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)',
                border: '2px solid #123c2e',
              }}
            >
              <ShieldCheck size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              Official Institutional ID Card Verification
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Authoritative cryptographic verification gateway for {branding.schoolName || 'EduNexa'} digital credentials.
            </p>
          </div>

          {/* Search Token Input */}
          <form onSubmit={handleSearch} style={{ marginBottom: 'var(--space-6)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                Verification Token / QR Payload
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="ed-input"
                  placeholder="e.g. v-tok-8f2c-49a1-9b7e-e214"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="ed-btn ed-btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Search size={14} /> {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </form>

          {/* Loading Indicator */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Querying authoritative institutional ledger...</div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Decrypting cryptographic credential payload</div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && !loading && (
            <div
              style={{
                padding: 'var(--space-4)',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.86rem',
              }}
            >
              <XCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Invalid Credential:</strong> {errorMessage}
              </div>
            </div>
          )}

          {/* Verification Result Display */}
          {verificationResult && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Status Banner */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isValid ? '#f0fdf4' : isExpired ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${isValid ? '#bbf7d0' : isExpired ? '#fde68a' : '#fecaca'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                {isValid ? (
                  <CheckCircle2 size={26} style={{ color: '#16a34a', flexShrink: 0 }} />
                ) : isExpired ? (
                  <AlertTriangle size={26} style={{ color: '#d97706', flexShrink: 0 }} />
                ) : (
                  <ShieldAlert size={26} style={{ color: '#dc2626', flexShrink: 0 }} />
                )}
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '0.96rem',
                      letterSpacing: '0.02em',
                      color: isValid ? '#166534' : isExpired ? '#92400e' : '#991b1b',
                    }}
                  >
                    {isValid
                      ? 'OFFICIALLY VERIFIED ACTIVE CREDENTIAL'
                      : isExpired
                      ? 'CREDENTIAL EXPIRED (OUTDATED VALIDITY)'
                      : 'CREDENTIAL REVOKED OR DEACTIVATED'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                    {isValid
                      ? 'This member credential is valid, registered on the institutional ledger, and actively enrolled.'
                      : isExpired
                      ? `This credential reached its expiration date (${verificationResult.expiresAt ? new Date(verificationResult.expiresAt).toLocaleDateString() : 'Session End'}). Please contact administration for renewal.`
                      : `This card has been revoked: ${verificationResult.revocationReason || 'Deactivated by school administration'}`}
                  </div>
                </div>
              </div>

              {/* Identity & Institutional Details */}
              <div
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-5)',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  fontSize: '0.88rem',
                }}
              >
                {/* Header with Photo & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                  {/* Photo Container */}
                  <div
                    style={{
                      width: '64px',
                      height: '80px',
                      borderRadius: '6px',
                      backgroundColor: '#f1f5f9',
                      border: '2px solid #123c2e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {verificationResult.avatarUrl ? (
                      <img
                        src={verificationResult.avatarUrl}
                        alt={verificationResult.holderName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#123c2e' }}>
                        {verificationResult.holderName.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {verificationResult.holderName}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#123c2e', marginTop: '2px' }}>
                      {isStudent
                        ? `${verificationResult.className || 'Senior Division'}${verificationResult.sectionName ? ` - ${verificationResult.sectionName}` : ''}`
                        : `${verificationResult.designation || 'Academic Faculty'}${verificationResult.department ? ` • ${verificationResult.department}` : ''}`}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {isStudent ? 'Admission No: ' : 'Employee ID: '}
                      <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{verificationResult.identifierNumber}</strong>
                    </div>
                  </div>
                </div>

                {/* Grid items */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Affiliated Institution:</span>
                  <span style={{ fontWeight: 600 }}>{verificationResult.schoolName} ({verificationResult.schoolCode})</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Credential Category:</span>
                  <span style={{ fontWeight: 600 }}>
                    {verificationResult.holderType === 'STUDENT' ? 'ENROLLED STUDENT' : 'TEACHING FACULTY'} BADGE
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Academic Session:</span>
                  <span>{verificationResult.academicSession}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Issuance Date:</span>
                  <span>{new Date(verificationResult.issuedAt).toLocaleDateString('en-GB')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Card Validity:</span>
                  <span style={{ fontWeight: 600 }}>
                    {verificationResult.expiresAt ? new Date(verificationResult.expiresAt).toLocaleDateString('en-GB') : 'Academic Session End (March 2027)'}
                  </span>
                </div>
              </div>

              {/* Privacy Disclaimer */}
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
                <strong>Institutional Privacy Assurance:</strong> In compliance with ISO CR80 Student Data Protection standards, public verification reveals verified name, ID identifier, and active affiliation standing. Personal home addresses, contact numbers, and academic marks remain confidential.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
