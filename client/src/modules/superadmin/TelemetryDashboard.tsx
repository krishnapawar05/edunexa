import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  Activity,
  Server,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { superadminApi } from '../../services/api.js';

export const TelemetryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTelemetry = async () => {
    try {
      setError(null);
      const res = await superadminApi.getTelemetry();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform telemetry from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTelemetry();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="ed-card ed-card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <RefreshCw size={24} className="ed-spin" style={{ margin: '0 auto 12px', color: 'var(--primary-600)' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Loading Platform Telemetry...</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Aggregating real multi-tenant statistics from PostgreSQL database</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Platform Telemetry & Governance
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Multi-Tenant Authority Overview • Real database metrics and system health
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'ed-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => navigate('/superadmin/schools')}
            className="ed-btn ed-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Onboard School Tenant</span>
          </button>
        </div>
      </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={handleRefresh} className="ed-btn ed-btn-secondary" style={{ padding: '2px 8px', fontSize: '0.78rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Total Tenants */}
        <div className="ed-card ed-card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
              School Tenants
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {data?.totalSchools ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--success-solid)', fontWeight: 500 }}>
              {data?.activeSchools ?? 0} Active • {data?.suspendedSchools ?? 0} Suspended
            </div>
          </div>
        </div>

        {/* Total Memberships */}
        <div className="ed-card ed-card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total Memberships
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {data?.totalMemberships ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {data?.totalStudents ?? 0} Students • {data?.totalStaff ?? 0} Staff
            </div>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="ed-card ed-card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
              Subscriptions
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {data?.totalSubscriptions ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {data?.planBreakdown?.length || 0} Tier Categories Active
            </div>
          </div>
        </div>

        {/* Database Health */}
        <div className="ed-card ed-card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: data?.systemHealth?.databaseConnected ? '#ecfdf5' : '#fef2f2',
              color: data?.systemHealth?.databaseConnected ? '#059669' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Server size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
              PostgreSQL Core
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {data?.systemHealth?.databaseConnected ? 'Operational' : 'Degraded'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Latency: {data?.systemHealth?.databaseLatencyMs ?? 0}ms • Uptime: {data?.systemHealth?.uptimeSeconds ?? 0}s
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Plan Breakdown & Infrastructure Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Plan Breakdown */}
        <div className="ed-card">
          <div className="ed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <CreditCard size={16} style={{ color: 'var(--primary-600)' }} />
              <span>Subscription Plan Distribution</span>
            </div>
            <button
              onClick={() => navigate('/superadmin/subscriptions')}
              className="ed-btn-link"
              style={{ fontSize: '0.78rem', color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Manage Plans →
            </button>
          </div>
          <div className="ed-card-body">
            {(!data?.planBreakdown || data.planBreakdown.length === 0) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active subscription allocations recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {data.planBreakdown.map((item: any) => {
                  const percent = data.totalSubscriptions ? Math.round((item.count / data.totalSubscriptions) * 100) : 0;
                  return (
                    <div key={item.planName}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.planName}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {item.count} tenant{item.count !== 1 ? 's' : ''} ({percent}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percent}%`,
                            backgroundColor:
                              item.planName.toLowerCase().includes('enterprise')
                                ? 'var(--primary-700)'
                                : item.planName.toLowerCase().includes('pro')
                                ? 'var(--primary-500)'
                                : '#10b981',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Multi-Tenant Security & Infrastructure Status */}
        <div className="ed-card">
          <div className="ed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <ShieldCheck size={16} style={{ color: 'var(--success-solid)' }} />
              <span>Platform Health & Security Boundary</span>
            </div>
            <button
              onClick={() => navigate('/superadmin/settings')}
              className="ed-btn-link"
              style={{ fontSize: '0.78rem', color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Settings →
            </button>
          </div>
          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>JWT Session Signing</span>
              <span style={{ fontWeight: 600, color: 'var(--success-solid)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Active (HS256 Dual Secret)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Multi-Tenant Isolation Guard</span>
              <span style={{ fontWeight: 600, color: 'var(--success-solid)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Enforced (Prisma Schema Scope)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Role Fast-Switcher Status</span>
              <span style={{ fontWeight: 600, color: 'var(--success-solid)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Removed (Role-Isolated)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Audit Log Stream</span>
              <span style={{ fontWeight: 600, color: 'var(--success-solid)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Persistent Append-Only
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Log Feed */}
      <div className="ed-card">
        <div className="ed-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Layers size={16} style={{ color: 'var(--primary-600)' }} />
            <span>Recent Administrative Audit Events</span>
          </div>
          <button
            onClick={() => navigate('/superadmin/audit-logs')}
            className="ed-btn ed-btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.78rem' }}
          >
            Full Audit Logs Stream →
          </button>
        </div>
        <div className="ed-card-body" style={{ padding: 0 }}>
          {(!data?.recentAuditLogs || data.recentAuditLogs.length === 0) ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No administrative activity logged yet.
            </div>
          ) : (
            <div className="ed-table-responsive">
              <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', backgroundColor: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '10px 16px' }}>Timestamp</th>
                    <th style={{ padding: '10px 16px' }}>Action</th>
                    <th style={{ padding: '10px 16px' }}>Actor</th>
                    <th style={{ padding: '10px 16px' }}>Tenant Context</th>
                    <th style={{ padding: '10px 16px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAuditLogs.map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: log.action.includes('STATUS')
                              ? '#fef3c7'
                              : log.action.includes('ONBOARD')
                              ? '#ecfdf5'
                              : '#eff6ff',
                            color: log.action.includes('STATUS')
                              ? '#b45309'
                              : log.action.includes('ONBOARD')
                              ? '#065f46'
                              : '#1d4ed8',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {log.user?.email || log.performedByUserId || 'system'}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>
                        {log.school ? `${log.school.name} (${log.school.code})` : 'Platform Global'}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
