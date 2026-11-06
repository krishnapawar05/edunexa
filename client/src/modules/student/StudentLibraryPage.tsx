import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  Layers,
  Bookmark,
  RefreshCw,
  Info,
  DollarSign,
  Filter,
} from 'lucide-react';
import { libraryApi } from '../../services/api.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';

export const StudentLibraryPage: React.FC = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'my_books' | 'catalog'>('my_books');
  const [finesPending, setFinesPending] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyRes, booksRes] = await Promise.all([
        libraryApi.getMyHistory(),
        libraryApi.listBooks({
          search: searchQuery.trim() || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          limit: 50,
        }),
      ]);

      const historyData = historyRes.data || {};
      setIssues(historyData.issues || []);
      setFinesPending(historyData.totalFinesPending || 0);

      const catalogData = booksRes.data || {};
      setCatalog(catalogData.books || []);
    } catch (err) {
      console.error('Failed to load library data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory]);

  const activeIssues = issues.filter((i) => i.status === 'ISSUED');
  const pastIssues = issues.filter((i) => i.status === 'RETURNED');
  const overdueIssues = issues.filter((i) => {
    if (i.status !== 'ISSUED') return false;
    return new Date(i.dueDate).getTime() < Date.now();
  });

  const categories = [
    'Science',
    'Mathematics',
    'English',
    'Hindi',
    'Computers',
    'History',
    'Geography',
    'General Knowledge',
  ];

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header Banner */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Academic Resource Center</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Institutional Library</span>
          </div>
          <h1 className="ed-page-header-title">
            <BookOpen size={26} style={{ color: 'var(--color-primary)' }} />
            My Library Books & Borrowing Ledger
          </h1>
          <p className="ed-page-header-desc">
            Track currently borrowed volumes, statutory return dates, overdue fines, and browse available library catalog holdings.
          </p>
        </div>

        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="ed-metrics-grid">
        <div className="ed-metric-card">
          <div className="ed-metric-title">
            <span>Currently Issued</span>
            <Bookmark size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="ed-metric-value">{activeIssues.length}</div>
          <div className="ed-metric-subtitle">Active book loans</div>
        </div>

        <div className="ed-metric-card">
          <div className="ed-metric-title">
            <span>Overdue Alerts</span>
            <AlertCircle size={18} style={{ color: overdueIssues.length > 0 ? '#dc2626' : '#16a34a' }} />
          </div>
          <div className="ed-metric-value" style={{ color: overdueIssues.length > 0 ? '#dc2626' : 'var(--text-primary)' }}>
            {overdueIssues.length}
          </div>
          <div className="ed-metric-subtitle">{overdueIssues.length > 0 ? 'Action required: return promptly' : 'All loans within due date'}</div>
        </div>

        <div className="ed-metric-card">
          <div className="ed-metric-title">
            <span>Returned History</span>
            <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
          </div>
          <div className="ed-metric-value">{pastIssues.length}</div>
          <div className="ed-metric-subtitle">Completed borrowing cycles</div>
        </div>

        <div className="ed-metric-card">
          <div className="ed-metric-title">
            <span>Pending Fines</span>
            <DollarSign size={18} style={{ color: finesPending > 0 ? '#d97706' : '#16a34a' }} />
          </div>
          <div className="ed-metric-value" style={{ color: finesPending > 0 ? '#d97706' : 'var(--text-primary)' }}>
            ₹{finesPending.toFixed(2)}
          </div>
          <div className="ed-metric-subtitle">{finesPending > 0 ? 'Clear with library desk' : 'No outstanding dues'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ed-nav-tabs">
        <button
          onClick={() => setActiveTab('my_books')}
          className={`ed-nav-tab ${activeTab === 'my_books' ? 'active' : ''}`}
        >
          <Bookmark className="w-4 h-4" />
          My Borrowed Books ({issues.length})
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`ed-nav-tab ${activeTab === 'catalog' ? 'active' : ''}`}
        >
          <Search className="w-4 h-4" />
          Explore Library Catalog ({catalog.length})
        </button>
      </div>

      {/* Tab 1: My Borrowed Books */}
      {activeTab === 'my_books' && (
        <div className="ed-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
            Active & Historical Loans
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px auto' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading your library borrowing record...</p>
            </div>
          ) : issues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--bg-subtle, #f7f9f6)', borderRadius: 'var(--radius-md)' }}>
              <BookOpen size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No library books currently issued.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Visit the campus library or browse the catalog below to borrow academic textbooks and reference materials.
              </p>
            </div>
          ) : (
            <div className="ed-table-container">
              <table className="ed-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Book Title & Details</th>
                    <th>Category</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Fine / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((item) => {
                    const isOverdue = item.status === 'ISSUED' && new Date(item.dueDate).getTime() < Date.now();
                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.book?.title || 'Unknown Title'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Author: {item.book?.author || 'N/A'} {item.book?.isbn && `• ISBN: ${item.book.isbn}`}
                          </div>
                        </td>
                        <td>
                          <span className="ed-badge ed-badge-neutral">{item.book?.category || 'General'}</span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {new Date(item.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ fontSize: '0.85rem', fontWeight: isOverdue ? 700 : 500, color: isOverdue ? '#dc2626' : 'var(--text-primary)' }}>
                          {new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {isOverdue && <span className="block text-[10px] text-rose-600 font-bold">OVERDUE</span>}
                        </td>
                        <td>
                          {item.status === 'RETURNED' ? (
                            <Badge variant="success">Returned</Badge>
                          ) : isOverdue ? (
                            <Badge variant="danger">Overdue</Badge>
                          ) : (
                            <Badge variant="info">Issued</Badge>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {item.fineAmount > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>₹{item.fineAmount.toFixed(2)} ({item.fineStatus})</span>
                          ) : (
                            item.notes || '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Catalog Search */}
      {activeTab === 'catalog' && (
        <div className="ed-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} style={{ color: 'var(--color-primary)' }} />
                Institutional Library Catalog Holdings
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Browse books across Science, Mathematics, English, Hindi, Computers, History, Geography, and GK.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="ed-search-box" style={{ minWidth: '220px' }}>
                <Search size={16} className="ed-search-icon" />
                <input
                  type="text"
                  placeholder="Search catalog titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ed-input"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ed-select"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px auto' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Searching institutional catalog...</p>
            </div>
          ) : catalog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--bg-subtle, #f7f9f6)', borderRadius: 'var(--radius-md)' }}>
              <BookOpen size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No books match your search query.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {catalog.map((book) => (
                <div
                  key={book.id}
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-default, #e2e6e0)',
                    borderRadius: 'var(--radius-md, 8px)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        style={{ width: '56px', height: '80px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '56px',
                          height: '80px',
                          backgroundColor: 'var(--bg-subtle, #eef2eb)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-primary)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          flexShrink: 0,
                        }}
                      >
                        {book.category.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <span className="ed-badge ed-badge-teal" style={{ fontSize: '10px', marginBottom: '4px' }}>
                        {book.category}
                      </span>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '2px' }}>
                        {book.title}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {book.author}
                      </p>
                      {book.edition && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                          {book.edition} • {book.publicationYear || ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-default, #e2e6e0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Shelf: <strong>{book.shelfLocation || 'Main'}</strong>
                    </span>
                    <span
                      className={`ed-badge ${
                        book.availableCopies > 0 ? 'ed-badge-teal' : 'ed-badge-neutral'
                      }`}
                      style={{ fontSize: '11px' }}
                    >
                      {book.availableCopies > 0 ? `${book.availableCopies} Copies Available` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
