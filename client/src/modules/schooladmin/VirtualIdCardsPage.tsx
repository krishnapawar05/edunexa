import React, { useState, useEffect } from 'react';
import {
  IdCard,
  QrCode,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Shield,
  Ban,
  ExternalLink,
  Sparkles,
  Download,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { coreApi } from '../../services/api.js';

interface CardHolder {
  id: string; // studentProfileId or staffProfileId
  holderType: 'STUDENT' | 'STAFF';
  name: string;
  identifier: string; // admissionNumber or employeeId
  subDetail: string; // class or department
  idCard: {
    id: string;
    cardNumber: string;
    verificationToken: string;
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    issuedAt: string;
    expiresAt: string | null;
  } | null;
}

export const VirtualIdCardsPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [holders, setHolders] = useState<CardHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'STUDENT' | 'STAFF'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Actions
  const [previewCard, setPreviewCard] = useState<CardHolder | null>(null);
  const [revokeCardTarget, setRevokeCardTarget] = useState<CardHolder | null>(null);
  const [revokeReason, setRevokeReason] = useState('Reported lost or compromised by institutional holder.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAllHolders = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, staffRes] = await Promise.all([
        coreApi.listStudents({ limit: 50 }),
        coreApi.listStaff({ limit: 50 }),
      ]);

      const combined: CardHolder[] = [];
      const rawStudents = Array.isArray(studentsRes) ? studentsRes : (studentsRes as any)?.items || [];
      const rawStaff = Array.isArray(staffRes) ? staffRes : (staffRes as any)?.items || [];

      rawStudents.forEach((s: any) => {
        combined.push({
          id: s.id,
          holderType: 'STUDENT',
          name: `${s.firstName} ${s.lastName}`,
          identifier: s.admissionNumber,
          subDetail: `${s.className} (Sec ${s.sectionName})`,
          idCard: s.idCard || null,
        });
      });

      rawStaff.forEach((st: any) => {
        combined.push({
          id: st.id,
          holderType: 'STAFF',
          name: `${st.firstName} ${st.lastName}`,
          identifier: st.employeeId,
          subDetail: `${st.departmentName} — ${st.designation}`,
          idCard: (st as any).idCard || null,
        });
      });

      setHolders(combined);
    } catch (err: any) {
      setError(err.message || 'Failed to load ID card directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllHolders();
  }, []);

  // Filtered Cards
  const filteredHolders = holders.filter((h) => {
    if (typeFilter !== 'ALL' && h.holderType !== typeFilter) return false;
    if (statusFilter !== 'ALL') {
      const cardStatus = h.idCard ? h.idCard.status : 'UNISSUED';
      if (cardStatus !== statusFilter) return false;
    }
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      return (
        h.name.toLowerCase().includes(q) ||
        h.identifier.toLowerCase().includes(q) ||
        (h.idCard?.cardNumber || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Issue / Regenerate Card
  const handleIssueCard = async (holder: CardHolder) => {
    setIsSubmitting(true);
    try {
      const issued = await coreApi.generateIdCard({
        holderType: holder.holderType,
        profileId: holder.id,
      });

      showToast(`Digital ID Card issued for ${holder.name} (${issued.cardNumber})!`);
      loadAllHolders();
    } catch (err: any) {
      showToast(err.message || 'Failed to issue ID card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke Card
  const handleRevokeCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeCardTarget || !revokeCardTarget.idCard) return;

    setIsSubmitting(true);
    try {
      await coreApi.deactivateIdCard(revokeCardTarget.idCard.id, revokeReason);
      showToast(`Card ${revokeCardTarget.idCard.cardNumber} has been permanently revoked.`);
      setRevokeCardTarget(null);
      loadAllHolders();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke ID card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = holders.filter((h) => h.idCard?.status === 'ACTIVE').length;
  const revokedCount = holders.filter((h) => h.idCard?.status === 'REVOKED').length;
  const unissuedCount = holders.filter((h) => !h.idCard).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

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
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Virtual ID Cards & QR Verification
            </h1>
            <Badge variant="info">{activeCount} Active Tokens</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Issue cryptographically tamper-evident institutional ID cards, verify credentials via privacy-preserving QR, and manage card lifecycles.
          </p>
        </div>

        <button
          onClick={loadAllHolders}
          disabled={loading}
          className="ed-btn ed-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Cards</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Cards
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {activeCount}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Revoked Cards
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger-600)', marginTop: '4px' }}>
            {revokedCount}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Pending Issuance
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {unissuedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by holder name, admission/staff ID, or card number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ed-input"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="ed-input"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="STAFF">Faculty / Staff</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Card Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ed-input"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="REVOKED">Revoked</option>
              <option value="UNISSUED">Unissued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--danger-50)',
            border: '1px solid var(--danger-200)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-800)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Cards Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Holder</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>ID / Admission</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Card Number</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Issued Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading ID card directory from PostgreSQL...
                  </td>
                </tr>
              ) : filteredHolders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No ID card records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredHolders.map((h) => (
                  <tr
                    key={h.id}
                    style={{ borderBottom: '1px solid var(--border-default)', transition: 'background-color 0.1s ease' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{h.subDetail}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge variant={h.holderType === 'STUDENT' ? 'info' : 'success'}>
                        {h.holderType}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {h.identifier}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {h.idCard ? h.idCard.cardNumber : <span style={{ color: 'var(--text-muted)' }}>Not issued</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {h.idCard ? new Date(h.idCard.issuedAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {h.idCard ? (
                        <Badge
                          variant={
                            h.idCard.status === 'ACTIVE'
                              ? 'success'
                              : h.idCard.status === 'REVOKED'
                              ? 'danger'
                              : 'neutral'
                          }
                        >
                          {h.idCard.status}
                        </Badge>
                      ) : (
                        <Badge variant="warning">UNISSUED</Badge>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {h.idCard ? (
                          <>
                            <button
                              onClick={() => setPreviewCard(h)}
                              className="ed-btn ed-btn-sm ed-btn-secondary"
                              title="Preview Virtual ID Card & QR"
                            >
                              <Eye size={13} />
                              <span>Card</span>
                            </button>
                            {h.idCard.status === 'ACTIVE' && (
                              <button
                                onClick={() => setRevokeCardTarget(h)}
                                className="ed-btn ed-btn-sm"
                                style={{ color: 'var(--danger-600)', borderColor: 'var(--danger-200)', background: 'transparent' }}
                                title="Revoke ID Card"
                              >
                                <Ban size={13} />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleIssueCard(h)}
                            disabled={isSubmitting}
                            className="ed-btn ed-btn-sm ed-btn-primary"
                            title="Generate and Issue ID Card"
                          >
                            <Sparkles size={13} />
                            <span>Issue Card</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Virtual ID Card Preview */}
      {previewCard && previewCard.idCard && (
        <Modal
          isOpen={Boolean(previewCard)}
          onClose={() => setPreviewCard(null)}
          title="Virtual Institutional ID Card (CR80 Standard)"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
            {/* Front of Card */}
            <div
              style={{
                width: '380px',
                height: '240px',
                borderRadius: '16px',
                backgroundColor: 'var(--ink-900)',
                color: '#ffffff',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {/* Top Accent bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  backgroundColor: branding.primaryAccent,
                }}
              />

              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: branding.primaryAccent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: '#ffffff',
                    }}
                  >
                    {branding.monogram}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, lineHeight: 1.1 }}>
                      {branding.shortName}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
                      INSTITUTIONAL CREDENTIAL
                    </div>
                  </div>
                </div>

                <Badge variant={previewCard.idCard.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {previewCard.idCard.status}
                </Badge>
              </div>

              {/* Card Body */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '68px',
                    height: '80px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: '#93c5fd',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {previewCard.name.slice(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {previewCard.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>
                    {previewCard.holderType} • {previewCard.subDetail}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '6px' }}>
                    ID: <strong style={{ color: '#ffffff' }}>{previewCard.identifier}</strong>
                  </div>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '2px' }}>
                    Card: {previewCard.idCard.cardNumber}
                  </div>
                </div>
              </div>

              {/* Card Footer with QR & Verification Token */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '8px',
                }}
              >
                <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                  Issued: {new Date(previewCard.idCard.issuedAt).toLocaleDateString()} • Valid: 2026–2027
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <QrCode size={22} style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Cryptographic QR</span>
                </div>
              </div>
            </div>

            {/* Public Verification Link */}
            <div
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>
                Token: <code style={{ color: 'var(--text-primary)' }}>{previewCard.idCard.verificationToken}</code>
              </span>
              <a
                href={`/api/v1/core/id-cards/verify/${encodeURIComponent(previewCard.idCard.verificationToken)}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}
              >
                Public QR API <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Button variant="secondary" onClick={() => setPreviewCard(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Revoke Card Confirmation */}
      {revokeCardTarget && (
        <Modal
          isOpen={Boolean(revokeCardTarget)}
          onClose={() => setRevokeCardTarget(null)}
          title="Revoke Virtual ID Card"
        >
          <form onSubmit={handleRevokeCard} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--danger-700)' }}>
              <Ban size={28} />
              <div>
                <div style={{ fontWeight: 700 }}>Security Revocation</div>
                <div style={{ fontSize: '0.84rem' }}>
                  Revoking card <strong>{revokeCardTarget.idCard?.cardNumber}</strong> for{' '}
                  <strong>{revokeCardTarget.name}</strong> ({revokeCardTarget.identifier}).
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Revocation Reason *
              </label>
              <textarea
                required
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="ed-input"
                placeholder="Specify the reason for card deactivation (e.g. Lost in transit, student transferred, security compromise)..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setRevokeCardTarget(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                style={{ backgroundColor: 'var(--danger-600)', borderColor: 'var(--danger-600)' }}
              >
                {isSubmitting ? 'Revoking...' : 'Confirm Revocation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
