import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Search,
  Tag,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  FileText,
  Download,
  MailCheck,
} from 'lucide-react';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';
import {
  useBulkSelection,
  SelectAllCheckbox,
  RowCheckbox,
  BulkActionToolbar,
  BulkActionItem,
} from '../../components/bulk/index.js';
import { operationsApi } from '../../services/api.js';

export const ParentNoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'notices' | 'events'>('notices');
  const [filterType, setFilterType] = useState<'ALL' | 'URGENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Selection
  const selection = useBulkSelection();
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [noticesRes, eventsRes] = await Promise.all([
        operationsApi.listNotices(),
        operationsApi.listEvents(),
      ]);
      setNotices(noticesRes || []);
      setEvents(eventsRes || []);
    } catch (err: any) {
      console.warn('Notices fetch error:', err);
      setError(err.message || 'Failed to load school circulars and events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredNotices = notices.filter((n) => {
    if (filterType === 'URGENT' && !n.isUrgent) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchContent = n.content?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  const handleBulkAction = async (action: string) => {
    const targetIds = selection.isAllMatching
      ? filteredNotices.map((n) => n.id)
      : selection.getSelectedList();

    if (targetIds.length === 0) {
      showToast('Please select at least one notice.');
      return;
    }

    setBulkActionLoading(action);
    try {
      const res = await operationsApi.bulkNoticeActions({
        ids: targetIds,
        action,
      });

      showToast(res.message || `Marked ${res.processedCount} notice(s) as read.`);
      selection.clearSelection();
      loadData();
    } catch (err: any) {
      showToast(err.message || `Failed to process bulk ${action.toLowerCase()}.`);
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleBulkExportCsv = () => {
    const exportTargets = selection.selectedCount > 0
      ? filteredNotices.filter((n) => selection.isSelected(n.id))
      : filteredNotices;

    if (exportTargets.length === 0) {
      showToast('No circulars to export.');
      return;
    }

    const headers = ['Title', 'Audience', 'Published Date', 'Urgent', 'Content'];
    const rows = exportTargets.map((n) => [
      `"${n.title}"`,
      `"${n.audience}"`,
      new Date(n.publishedAt || n.createdAt).toLocaleDateString(),
      n.isUrgent ? 'YES' : 'NO',
      `"${(n.content || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `parent-notices-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${exportTargets.length} circulars to CSV.`);
  };

  const bulkActions: BulkActionItem[] = [
    {
      id: 'bulk-mark-read',
      label: 'Mark as Read',
      icon: <MailCheck size={14} />,
      onClick: () => handleBulkAction('MARK_READ'),
      loading: bulkActionLoading === 'MARK_READ',
      variant: 'primary',
    },
    {
      id: 'bulk-export-notices',
      label: 'Export CSV',
      icon: <Download size={14} />,
      onClick: handleBulkExportCsv,
      variant: 'outline',
    },
  ];

  return (
    <div className="ed-page">
      <Breadcrumbs
        items={[
          { label: 'Parent Portal', href: '/parent' },
          { label: 'School Notices' },
        ]}
      />

      {/* Header */}
      <div className="ed-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Bell size={24} style={{ color: 'var(--primary-600)' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Official School Notices & Circulars
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Institutional announcements, event advisories, and administrative communications for guardians.
            </p>
          </div>

          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload Circulars
          </button>
        </div>

        {/* View Switcher & Search Bar */}
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`ed-btn ed-btn-sm ${activeTab === 'notices' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
              onClick={() => setActiveTab('notices')}
            >
              <Bell size={13} /> Circulars ({notices.length})
            </button>
            <button
              className={`ed-btn ed-btn-sm ${activeTab === 'events' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
              onClick={() => setActiveTab('events')}
            >
              <Calendar size={13} /> School Calendar ({events.length})
            </button>
          </div>

          {activeTab === 'notices' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search notices..."
                  className="ed-input"
                  style={{ paddingLeft: '32px', width: '100%', fontSize: '0.82rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="ed-input"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="ALL">All Categories</option>
                <option value="URGENT">Urgent Priority</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Notices View */}
      {activeTab === 'notices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <BulkActionToolbar
            selection={selection}
            actions={bulkActions}
            totalMatchingCount={filteredNotices.length}
            currentPageIds={filteredNotices.map((n) => n.id)}
            entityName="notices"
          />

          {loading ? (
            <div className="ed-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Retrieving school notices from database...</p>
            </div>
          ) : filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => {
              const pubDate = new Date(notice.publishedAt || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={notice.id}
                  className="ed-card"
                  style={{
                    padding: 'var(--space-5)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    borderLeft: notice.isUrgent ? '4px solid var(--danger-solid)' : '1px solid var(--border-default)',
                    backgroundColor: selection.isSelected(notice.id) ? 'var(--primary-50, rgba(26, 77, 46, 0.05))' : undefined,
                  }}
                  onClick={() => setSelectedNotice(notice)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: '2px' }}>
                        <RowCheckbox
                          id={notice.id}
                          checked={selection.isSelected(notice.id)}
                          onToggle={selection.toggleSelect}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          {notice.isUrgent && (
                            <span className="ed-badge ed-badge-danger" style={{ fontSize: '0.72rem' }}>
                              URGENT ADVISORY
                            </span>
                          )}
                          <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.72rem' }}>
                            {notice.audience === 'PARENTS_ONLY' ? 'Parents Only' : 'All School Members'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {pubDate}
                          </span>
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {notice.title}
                        </h3>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>

                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {notice.content}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="ed-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <h4 style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                No Notices Found
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                There are currently no circulars published matching your criteria. Institutional advisories will appear here upon publication.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Events View */}
      {activeTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {loading ? (
            <div className="ed-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Retrieving calendar events...</p>
            </div>
          ) : events.length > 0 ? (
            events.map((evt) => {
              const start = new Date(evt.startDate);
              const end = new Date(evt.endDate);
              const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <div key={evt.id} className="ed-card" style={{ padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="ed-badge ed-badge-info" style={{ fontSize: '0.72rem' }}>
                          Institutional Event
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                          {startStr} {startStr !== endStr ? `– ${endStr}` : ''}
                        </span>
                      </div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {evt.title}
                      </h3>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 10px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {evt.description}
                  </p>

                  {evt.venue && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={12} /> Venue: {evt.venue}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="ed-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <h4 style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                No Upcoming Events Scheduled
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                There are no scheduled extracurricular or academic events in the institutional calendar right now.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notice Reader Modal */}
      {selectedNotice && (
        <div className="ed-modal-overlay" onClick={() => setSelectedNotice(null)}>
          <div
            className="ed-modal-content"
            style={{ maxWidth: '600px', width: '100%', padding: 'var(--space-6)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {selectedNotice.isUrgent && (
                    <span className="ed-badge ed-badge-danger" style={{ fontSize: '0.72rem' }}>
                      URGENT
                    </span>
                  )}
                  <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.72rem' }}>
                    {selectedNotice.audience}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                className="ed-btn ed-btn-sm ed-btn-secondary"
                onClick={() => setSelectedNotice(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
              <span>Published: {new Date(selectedNotice.publishedAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {selectedNotice.targetClass && <span>Target: {selectedNotice.targetClass}</span>}
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-sm)', lineHeight: 1.6, fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
              {selectedNotice.content}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="ed-btn ed-btn-primary" onClick={() => setSelectedNotice(null)}>
                Acknowledged
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            fontSize: '0.86rem',
          }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--success-solid, #10b981)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
