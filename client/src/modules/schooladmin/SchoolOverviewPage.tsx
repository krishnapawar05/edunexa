import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  CreditCard,
  CalendarCheck,
  FileCheck,
  IdCard,
  Bell,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { coreApi } from '../../services/api.js';

export const SchoolOverviewPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await coreApi.getSchoolOverviewStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load school telemetry metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: branding.primaryAccent,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.4rem',
            }}
          >
            {branding.monogram}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {branding.shortName} Overview
              </h1>
              <Badge variant="success">Institutional Admin</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Consolidated operational telemetry, student roster status, and academic governance.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={loadStats}
            disabled={loading}
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
          <Link
            to="/admin/students"
            className="ed-btn ed-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <GraduationCap size={16} />
            <span>Student Directory</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
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
          <AlertCircle size={20} />
          <div style={{ flex: 1, fontSize: '0.88rem' }}>{error}</div>
          <button onClick={loadStats} className="ed-btn ed-btn-sm ed-btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Card 1: Students */}
        <Link
          to="/admin/students"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="ed-card-interactive"
            style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active Students
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GraduationCap size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.students?.active ?? 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <span>Total Enrolled: {stats?.students?.total ?? 0}</span>
              <span style={{ color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                View Directory <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </Link>

        {/* Card 2: Faculty & HR */}
        <Link
          to="/admin/faculty"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="ed-card-interactive"
            style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Faculty & Staff
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.staff?.active ?? 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <span>Total Staff: {stats?.staff?.total ?? 0}</span>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                View Faculty <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </Link>

        {/* Card 3: Admissions Queue */}
        <Link
          to="/admin/admissions"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="ed-card-interactive"
            style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Pending Admissions
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileCheck size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.admissions?.pendingReview ?? 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <span>Awaiting Review</span>
              <span style={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                Review Queue <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </Link>

        {/* Card 4: Daily Attendance */}
        <Link
          to="/admin/attendance"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="ed-card-interactive"
            style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Today's Attendance
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarCheck size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : `${stats?.attendance?.percentage ?? 0}%`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <span>Present: {stats?.attendance?.present ?? 0} / Marked: {stats?.attendance?.markedToday ?? 0}</span>
              <span style={{ color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                Register <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </Link>

        {/* Card 5: Virtual ID Cards */}
        <Link
          to="/admin/id-cards"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="ed-card-interactive"
            style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active ID Cards
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(14, 165, 233, 0.1)',
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IdCard size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : stats?.idCards?.activeCount ?? 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <span>Cryptographic QR Issued</span>
              <span style={{ color: '#0ea5e9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                Manage Cards <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </Link>

        {/* Card 6: Fees & Invoices */}
        <Link
          to="/admin/fees"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            className="ed-card-interactive"
            style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Outstanding Fees
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {loading ? '...' : `₹${(stats?.finance?.totalOutstanding ?? 0).toLocaleString()}`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <span>Collection: {stats?.finance?.collectionRate ?? 0}%</span>
              <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                Invoices <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Two Column Layout: Notices & Upcoming Events */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Left Column: Recent School Notices */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Bell size={18} style={{ color: 'var(--primary-600)' }} />
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Institutional Notices
              </h2>
            </div>
            <Link
              to="/admin/events-notices"
              style={{ fontSize: '0.78rem', color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading announcements...
            </div>
          ) : stats?.recentNotices?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {stats.recentNotices.map((n: any) => (
                <div
                  key={n.id}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {n.title}
                    </span>
                    {n.isUrgent && <Badge variant="danger">Urgent</Badge>}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {n.content}
                  </p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Audience: <strong>{n.audience}</strong> • Published: {new Date(n.publishedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 'var(--space-6)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              No notices published recently.
            </div>
          )}
        </div>

        {/* Right Column: Upcoming School Events */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calendar size={18} style={{ color: '#10b981' }} />
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Upcoming Institutional Events
              </h2>
            </div>
            <Link
              to="/admin/events-notices"
              style={{ fontSize: '0.78rem', color: '#10b981', textDecoration: 'none', fontWeight: 600 }}
            >
              View Calendar
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading upcoming events...
            </div>
          ) : stats?.upcomingEvents?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {stats.upcomingEvents.map((e: any) => (
                <div
                  key={e.id}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {e.title}
                    </span>
                    <Badge variant="info">{new Date(e.startDate).toLocaleDateString()}</Badge>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {e.description}
                  </p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Venue: <strong>{e.venue || 'Main Campus Auditorium'}</strong> • Audience: <strong>{e.audience}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 'var(--space-6)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              No upcoming events scheduled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
