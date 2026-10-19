import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Calendar,
  Lock,
} from 'lucide-react';
import { superadminApi } from '../../services/api.js';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showPayloadModal, setShowPayloadModal] = useState(false);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superadminApi.getAuditLogs({
        action: actionFilter,
        limit: 100,
      });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch administrative audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  const handleInspectPayload = (log: any) => {
    setSelectedLog(log);
    setShowPayloadModal(true);
  };

  const getActionColor = (action: string) => {
    if (action.includes('ONBOARD') || action.includes('CREATED')) return { bg: '#ecfdf5', text: '#065f46' };
    if (action.includes('STATUS') || action.includes('SUSPEND')) return { bg: '#fef3c7', text: '#b45309' };
    if (action.includes('ROLE') || action.includes('PERMISSION')) return { bg: '#f3e8ff', text: '#6b21a8' };
    if (action.includes('SETTINGS')) return { bg: '#e0f2fe', text: '#0369a1' };
    return { bg: '#f1f5f9', text: '#475569' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Administrative Audit Logs
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Append-only security audit trail of privileged administrative and tenant actions
          </p>
        </div>

        <button onClick={loadAuditLogs} className="ed-btn ed-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} className={loading ? 'ed-spin' : ''} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="ed-card ed-card-body" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="ed-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{ width: '240px' }}
            >
              <option value="ALL">All Audit Actions</option>
              <option value="TENANT_ONBOARDED">TENANT_ONBOARDED</option>
              <option value="TENANT_STATUS_UPDATED">TENANT_STATUS_UPDATED</option>
              <option value="TENANT_METADATA_UPDATED">TENANT_METADATA_UPDATED</option>
              <option value="ROLE_PERMISSION_CHANGED">ROLE_PERMISSION_CHANGED</option>
              <option value="SUBSCRIPTION_PLAN_MODIFIED">SUBSCRIPTION_PLAN_MODIFIED</option>
              <option value="SYSTEM_SETTINGS_UPDATED">SYSTEM_SETTINGS_UPDATED</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setActionFilter('ALL');
              loadAuditLogs();
            }}
            className="ed-btn ed-btn-secondary"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger-text)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button onClick={loadAuditLogs} className="ed-btn ed-btn-secondary" style={{ padding: '2px 8px', fontSize: '0.78rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="ed-card">
        <div className="ed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} style={{ color: 'var(--primary-600)' }} />
            <span>Audit Trail Records ({logs.length})</span>
          </div>
        </div>

        <div className="ed-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} className="ed-spin" style={{ margin: '0 auto 8px' }} />
              <div>Fetching persistent audit logs from PostgreSQL...</div>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Layers size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No audit log entries found</div>
              <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                Privileged actions such as tenant onboarding, status changes, and settings updates are recorded here.
              </div>
            </div>
          ) : (
            <div className="ed-table-responsive">
              <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', backgroundColor: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '12px 16px' }}>Timestamp</th>
                    <th style={{ padding: '12px 16px' }}>Event Action</th>
                    <th style={{ padding: '12px 16px' }}>Actor Identity</th>
                    <th style={{ padding: '12px 16px' }}>Target Resource</th>
                    <th style={{ padding: '12px 16px' }}>Tenant Context</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const colors = getActionColor(log.action);
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: colors.bg,
                              color: colors.text,
                            }}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {log.user?.email || log.performedByUserId || 'system-admin'}
                          </div>
                          {log.user && (
                            <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                              {log.user.firstName} {log.user.lastName}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.entityType}</div>
                          <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {log.entityId || 'global'}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {log.school ? (
                            <div>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.school.name}</span>
                              <span style={{ fontSize: '0.72rem', marginLeft: '4px' }}>({log.school.code})</span>
                            </div>
                          ) : (
                            <span style={{ fontStyle: 'italic' }}>Platform Authority</span>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleInspectPayload(log)}
                            className="ed-btn ed-btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            title="Inspect audit payload"
                          >
                            <Eye size={12} style={{ marginRight: '4px' }} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payload Inspection Modal */}
      {showPayloadModal && selectedLog && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '520px' }}>
            <div className="ed-modal-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Audit Record Details
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Event ID: {selectedLog.id} • Action: {selectedLog.action}
                </div>
              </div>
              <button onClick={() => setShowPayloadModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="ed-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.80rem', backgroundColor: 'var(--bg-subtle)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Actor:</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.user?.email || selectedLog.performedByUserId}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Timestamp:</div>
                  <div style={{ fontWeight: 600 }}>{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Target Entity:</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.entityType} ({selectedLog.entityId})</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Tenant:</div>
                  <div style={{ fontWeight: 600 }}>{selectedLog.school?.name || 'Platform Scope'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Event Data Payload:
                </div>
                <pre
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.76rem',
                    overflowX: 'auto',
                    maxHeight: '260px',
                    margin: 0,
                  }}
                >
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="ed-modal-footer">
              <button onClick={() => setShowPayloadModal(false)} className="ed-btn ed-btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
