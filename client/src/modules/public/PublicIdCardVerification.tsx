import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PublicIdCardVerificationResponse } from '@edunexa/shared';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { getApiUrl } from '../../services/api.js';

interface PublicIdCardVerificationProps {
  initialToken?: string;
  onBackToPublic: () => void;
}

export const PublicIdCardVerification: React.FC<PublicIdCardVerificationProps> = ({
  initialToken = 'v-tok-8f2c-49a1-9b7e-e214',
  onBackToPublic,
}) => {
  const { branding } = useSchoolBranding();
  const [tokenInput, setTokenInput] = useState(initialToken);
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
    if (initialToken) {
      fetchVerification(initialToken);
    }
  }, [initialToken]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVerification(tokenInput);
  };

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
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {/* Navigation Back */}
        <button
          onClick={onBackToPublic}
          className="ed-btn ed-btn-secondary"
          style={{ marginBottom: 'var(--space-5)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} /> Back to Public Website
        </button>

        {/* Verification Card */}
        <div className="ed-card" style={{ padding: 'var(--space-6)', boxShadow: 'var(--shadow-lg)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-700)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)',
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-primary)' }}>
              Official Institutional ID Card Verification
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Public verification gateway for {branding.schoolName} credentials.
            </p>
          </div>

          {/* Search Token Input */}
          <form onSubmit={handleSearch} style={{ marginBottom: 'var(--space-6)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Verification Token / QR Payload</label>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                >
                  <Search size={14} /> Verify
                </button>
              </div>
            </div>
          </form>

          {/* Loading Indicator */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
              Verifying cryptographic credential token...
            </div>
          )}

          {/* Error Message */}
          {errorMessage && !loading && (
            <div
              style={{
                padding: 'var(--space-4)',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.86rem',
              }}
            >
              <XCircle size={18} />
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
                  padding: 'var(--space-4) var(--space-5)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: verificationResult.isValid ? 'var(--success-bg)' : 'var(--danger-bg)',
                  border: `1px solid ${verificationResult.isValid ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                {verificationResult.isValid ? (
                  <CheckCircle2 size={24} style={{ color: 'var(--success-solid)', flexShrink: 0 }} />
                ) : (
                  <ShieldAlert size={24} style={{ color: 'var(--danger-solid)', flexShrink: 0 }} />
                )}
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: verificationResult.isValid ? 'var(--success-text)' : 'var(--danger-text)',
                    }}
                  >
                    {verificationResult.isValid
                      ? 'OFFICIALLY VERIFIED ACTIVE CREDENTIAL'
                      : 'CREDENTIAL REVOKED OR INACTIVE'}
                  </div>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>
                    {verificationResult.isValid
                      ? 'This member credential is valid and registered with active enrollment in the institution.'
                      : `This card has been revoked: ${verificationResult.revocationReason || 'Deactivated by school administration'}`}
                  </div>
                </div>
              </div>

              {/* Minimal Safe Identity Details (Strictly No Sensitive PII) */}
              <div
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4) var(--space-5)',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cardholder Name:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{verificationResult.holderName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Identifier / Roll No:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{verificationResult.identifierNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Affiliated Institution:</span>
                  <span style={{ fontWeight: 600 }}>{verificationResult.schoolName} ({verificationResult.schoolCode})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Credential Type:</span>
                  <span style={{ fontWeight: 600 }}>{verificationResult.holderType} BADGE</span>
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
                  <span style={{ color: 'var(--text-muted)' }}>Valid Through:</span>
                  <span>{verificationResult.expiresAt ? new Date(verificationResult.expiresAt).toLocaleDateString('en-GB') : 'Academic Session End'}</span>
                </div>
              </div>

              {/* Privacy Disclaimer */}
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
                <strong>Privacy Notice:</strong> In compliance with Institutional Student Data Protection policies, public verification records expose only verified name, ID identifier, and active affiliation status. Private records, grades, contact numbers, and parent details are shielded from public verification.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
