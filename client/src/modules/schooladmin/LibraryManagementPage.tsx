import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Library,
  Layers,
  ArrowLeftRight,
  AlertCircle,
  FileText,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Printer,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  RefreshCw,
  UserCheck,
  Bookmark,
  DollarSign,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { libraryApi, coreApi } from '../../services/api.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';

type TabKey = 'dashboard' | 'inventory' | 'circulation' | 'overdue' | 'student_history' | 'reports' | 'settings';

export const LibraryManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tab 1: Telemetry Data
  const [stats, setStats] = useState<any>({
    totalBooks: 0,
    totalCopies: 0,
    availableCopies: 0,
    issuedCopies: 0,
    overdueBooks: 0,
    registeredMembers: 0,
    todayCirculation: 0,
    pendingFinesTotal: 0,
    collectedFinesTotal: 0,
    recentIssues: [],
    recentReturns: [],
    overdueAlerts: [],
    popularBooks: [],
  });

  // Tab 2: Inventory Catalog
  const [books, setBooks] = useState<any[]>([]);
  const [totalBooksCount, setTotalBooksCount] = useState(0);
  const [bookSearch, setBookSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [bookPage, setBookPage] = useState(1);

  // Modals for Book CRUD
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Science',
    publisher: '',
    edition: '1st Edition',
    publicationYear: 2024,
    language: 'English',
    description: '',
    coverUrl: '',
    totalCopies: 5,
    shelfLocation: 'Main Wing - Shelf A1',
  });

  // Tab 3: Circulation (Active Issues)
  const [issues, setIssues] = useState<any[]>([]);
  const [totalIssuesCount, setTotalIssuesCount] = useState(0);
  const [issueStatusFilter, setIssueStatusFilter] = useState('ISSUED');
  const [issuePage, setIssuePage] = useState(1);

  // Issue Book Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [studentSearchText, setStudentSearchText] = useState('');
  const [availableBooksList, setAvailableBooksList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [issueDueDate, setIssueDueDate] = useState('');
  const [issueNotes, setIssueNotes] = useState('');

  // Return Book Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningIssue, setReturningIssue] = useState<any | null>(null);
  const [returnCondition, setReturnCondition] = useState<'GOOD' | 'DAMAGED' | 'LOST'>('GOOD');
  const [waiveFine, setWaiveFine] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');

  // Tab 4: Overdue & Fines
  const [overdueList, setOverdueList] = useState<any[]>([]);

  // Tab 5: Student History Dossier
  const [dossierStudentSearch, setDossierStudentSearch] = useState('');
  const [selectedStudentDossier, setSelectedStudentDossier] = useState<any | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  // Tab 6: Reports
  const [reportType, setReportType] = useState('INVENTORY');
  const [reportCategory, setReportCategory] = useState('ALL');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportResult, setReportResult] = useState<any | null>(null);

  // Tab 7: Settings
  const [settings, setSettings] = useState({
    finePerDay: 2.0,
    gracePeriodDays: 1,
    maxFineAmount: 200.0,
    maxBooksPerStudent: 3,
    loanDurationDays: 14,
  });

  // --------------------------------------------------------------------------
  // Data Loaders
  // --------------------------------------------------------------------------
  const loadStats = useCallback(async () => {
    try {
      const res = await libraryApi.getDashboardStats();
      if (res.data) setStats(res.data);
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err);
    }
  }, []);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await libraryApi.listBooks({
        search: bookSearch.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        page: bookPage,
        limit: 15,
      });
      if (res.data) {
        setBooks(res.data.books || []);
        setTotalBooksCount(res.data.pagination?.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to load books catalog:', err);
    } finally {
      setLoading(false);
    }
  }, [bookSearch, selectedCategory, selectedStatus, bookPage]);

  const loadIssues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await libraryApi.listIssues({
        status: issueStatusFilter !== 'ALL' ? issueStatusFilter : undefined,
        page: issuePage,
        limit: 15,
      });
      if (res.data) {
        setIssues(res.data.issues || []);
        setTotalIssuesCount(res.data.pagination?.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to load circulation issues:', err);
    } finally {
      setLoading(false);
    }
  }, [issueStatusFilter, issuePage]);

  const loadOverdue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await libraryApi.getOverdueBooks({ limit: 50 });
      if (res.data) {
        setOverdueList(res.data.issues || []);
      }
    } catch (err: any) {
      console.error('Failed to load overdue books:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await libraryApi.getSettings();
      if (res.data) {
        setSettings({
          finePerDay: res.data.finePerDay ?? 2.0,
          gracePeriodDays: res.data.gracePeriodDays ?? 1,
          maxFineAmount: res.data.maxFineAmount ?? 200.0,
          maxBooksPerStudent: res.data.maxBooksPerStudent ?? 3,
          loanDurationDays: res.data.loanDurationDays ?? 14,
        });
      }
    } catch (err: any) {
      console.error('Failed to load library settings:', err);
    }
  }, []);

  // Initial Load and Tab Changes
  useEffect(() => {
    loadStats();
    loadSettings();
  }, [loadStats, loadSettings]);

  useEffect(() => {
    if (activeTab === 'inventory') loadBooks();
    else if (activeTab === 'circulation') loadIssues();
    else if (activeTab === 'overdue') loadOverdue();
  }, [activeTab, loadBooks, loadIssues, loadOverdue]);

  // Load students for Quick Issue
  const loadStudentsForIssue = async () => {
    try {
      const res: any = await coreApi.listStudents({ limit: 100 });
      const list = res.data?.students || res.students || [];
      setStudentsList(list);
    } catch (err) {
      console.error('Failed to load student profiles:', err);
    }
  };

  // --------------------------------------------------------------------------
  // Seed Sample Books (30 Books across 8 Subjects)
  // --------------------------------------------------------------------------
  const handleSeedSampleBooks = async () => {
    if (!window.confirm('Seed 30 authentic Indian & international library books covering all 8 curriculum categories with demo transactions?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await libraryApi.seedSampleBooks();
      setFeedback({
        type: 'success',
        message: res.message || 'Successfully seeded 30 books and demo transactions into PostgreSQL!',
      });
      loadStats();
      if (activeTab === 'inventory') loadBooks();
      if (activeTab === 'circulation') loadIssues();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to seed sample books.' });
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Book CRUD Handlers
  // --------------------------------------------------------------------------
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      category: 'Science',
      publisher: '',
      edition: '1st Edition',
      publicationYear: new Date().getFullYear(),
      language: 'English',
      description: '',
      coverUrl: '',
      totalCopies: 5,
      shelfLocation: 'Main Wing - Shelf A1',
    });
    setShowBookModal(true);
  };

  const handleOpenEditBook = (b: any) => {
    setEditingBook(b);
    setBookForm({
      title: b.title,
      author: b.author,
      isbn: b.isbn || '',
      category: b.category,
      publisher: b.publisher || '',
      edition: b.edition || '1st Edition',
      publicationYear: b.publicationYear || 2024,
      language: b.language || 'English',
      description: b.description || '',
      coverUrl: b.coverUrl || '',
      totalCopies: b.totalCopies,
      shelfLocation: b.shelfLocation || '',
    });
    setShowBookModal(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author || !bookForm.category) {
      alert('Please fill out all required fields (Title, Author, Category).');
      return;
    }

    try {
      setActionLoading(true);
      if (editingBook) {
        await libraryApi.updateBook(editingBook.id, bookForm);
        setFeedback({ type: 'success', message: `Book "${bookForm.title}" updated successfully.` });
      } else {
        await libraryApi.createBook(bookForm);
        setFeedback({ type: 'success', message: `Book "${bookForm.title}" added to inventory catalog.` });
      }
      setShowBookModal(false);
      loadBooks();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to save book record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone if copies are issued.`)) {
      return;
    }
    try {
      setActionLoading(true);
      await libraryApi.deleteBook(bookId);
      setFeedback({ type: 'success', message: `Book "${title}" deleted from catalog.` });
      loadBooks();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete book.');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Quick Issue Book
  // --------------------------------------------------------------------------
  const handleOpenIssueModal = async () => {
    setSelectedStudentId('');
    setSelectedBookId('');
    setIssueNotes('');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + (settings.loanDurationDays || 14));
    setIssueDueDate(defaultDate.toISOString().split('T')[0]);

    await loadStudentsForIssue();
    // Load available books
    try {
      const res = await libraryApi.listBooks({ status: 'AVAILABLE', limit: 100 });
      setAvailableBooksList(res.data?.books || []);
    } catch (err) {
      console.error(err);
    }
    setShowIssueModal(true);
  };

  const handleProcessIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedBookId || !issueDueDate) {
      alert('Please select both a student, an available book, and a statutory due date.');
      return;
    }

    try {
      setActionLoading(true);
      await libraryApi.issueBook({
        studentProfileId: selectedStudentId,
        bookId: selectedBookId,
        dueDate: new Date(issueDueDate).toISOString(),
        notes: issueNotes || undefined,
      });
      setFeedback({ type: 'success', message: 'Book successfully issued to student!' });
      setShowIssueModal(false);
      loadStats();
      if (activeTab === 'circulation') loadIssues();
      if (activeTab === 'inventory') loadBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to issue book.');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Return Book
  // --------------------------------------------------------------------------
  const handleOpenReturnModal = (issue: any) => {
    setReturningIssue(issue);
    setReturnCondition('GOOD');
    setWaiveFine(false);
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningIssue) return;

    try {
      setActionLoading(true);
      const res = await libraryApi.returnBook(returningIssue.id, {
        returnCondition,
        waiveFine,
        notes: returnNotes || undefined,
      });

      const fineMsg = res.data?.fineAmount > 0
        ? waiveFine
          ? ` (Fine of ₹${res.data.fineAmount} waived)`
          : ` (Fine accrued: ₹${res.data.fineAmount})`
        : '';

      setFeedback({
        type: 'success',
        message: `Book "${returningIssue.book?.title}" marked as RETURNED${fineMsg}.`,
      });

      setShowReturnModal(false);
      loadStats();
      if (activeTab === 'circulation') loadIssues();
      if (activeTab === 'overdue') loadOverdue();
      if (activeTab === 'inventory') loadBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to process return.');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Fine Payment / Waiver Action
  // --------------------------------------------------------------------------
  const handleUpdateFine = async (issueId: string, status: 'PAID' | 'WAIVED') => {
    try {
      setActionLoading(true);
      await libraryApi.updateFineStatus(issueId, { fineStatus: status });
      setFeedback({
        type: 'success',
        message: status === 'PAID' ? 'Fine recorded as PAID successfully.' : 'Fine waived by administrator.',
      });
      loadStats();
      if (activeTab === 'overdue') loadOverdue();
      if (activeTab === 'circulation') loadIssues();
    } catch (err: any) {
      alert(err.message || 'Failed to update fine status.');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Student History Dossier
  // --------------------------------------------------------------------------
  const handleSearchStudentDossier = async (studentId: string) => {
    if (!studentId) return;
    try {
      setDossierLoading(true);
      const res = await libraryApi.getStudentHistory(studentId);
      setSelectedStudentDossier(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch student library dossier.');
    } finally {
      setDossierLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Reports
  // --------------------------------------------------------------------------
  const handleGenerateReport = async () => {
    try {
      setActionLoading(true);
      const res = await libraryApi.generateReport({
        reportType,
        category: reportCategory !== 'ALL' ? reportCategory : undefined,
        startDate: reportStartDate || undefined,
        endDate: reportEndDate || undefined,
      });
      setReportResult(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to generate library report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!reportResult || !reportResult.data || reportResult.data.length === 0) {
      alert('No report data available to export.');
      return;
    }
    const data = reportResult.data;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row: any) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `library_report_${reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --------------------------------------------------------------------------
  // Settings Update
  // --------------------------------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await libraryApi.updateSettings(settings);
      setFeedback({ type: 'success', message: 'Library policies and lending parameters saved successfully.' });
    } catch (err: any) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setActionLoading(false);
    }
  };

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Resource & Knowledge Center</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Section 11 Institutional Library</span>
          </div>
          <h1 className="ed-page-header-title">
            <Library className="w-7 h-7 text-emerald-700" />
            Library Management & Circulation System
          </h1>
          <p className="ed-page-header-desc">
            Complete institutional inventory catalog, book issue & return workflows, statutory overdue fine calculation, student borrowing ledgers, and dynamic library reports.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleSeedSampleBooks}
            disabled={actionLoading}
            className="ed-btn ed-btn-outline cursor-pointer"
            title="Populate 30 realistic books across Science, Maths, English, Hindi, Computers, etc."
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Seed 30 Sample Books
          </button>

          <button
            onClick={handleOpenAddBook}
            className="ed-btn ed-btn-secondary cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Book
          </button>

          <button
            onClick={handleOpenIssueModal}
            className="ed-btn ed-btn-primary cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Quick Issue Book
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="ed-nav-tabs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`ed-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <TrendingUp className="w-4 h-4" />
          Dashboard Telemetry
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`ed-nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
        >
          <BookOpen className="w-4 h-4" />
          Book Inventory ({stats.totalBooks || 0})
        </button>

        <button
          onClick={() => setActiveTab('circulation')}
          className={`ed-nav-tab ${activeTab === 'circulation' ? 'active' : ''}`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Circulation Ledger ({stats.issuedCopies || 0} Issued)
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`ed-nav-tab ${activeTab === 'overdue' ? 'active' : ''}`}
        >
          <AlertCircle className="w-4 h-4" />
          Overdue & Fines ({stats.overdueBooks || 0})
        </button>

        <button
          onClick={() => setActiveTab('student_history')}
          className={`ed-nav-tab ${activeTab === 'student_history' ? 'active' : ''}`}
        >
          <UserCheck className="w-4 h-4" />
          Student History Dossier
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`ed-nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
        >
          <FileText className="w-4 h-4" />
          Library Reports
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`ed-nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings className="w-4 h-4" />
          Lending Policies
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: DASHBOARD TELEMETRY */}
      {/* ==================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Overdue Alert Banner if any overdue books */}
          {stats.overdueBooks > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
                <div>
                  <h4 className="font-semibold text-amber-900">
                    {stats.overdueBooks} Book{stats.overdueBooks !== 1 ? 's' : ''} Past Due Date
                  </h4>
                  <p className="text-sm text-amber-700">
                    Total accrued pending fines: <strong>₹{stats.pendingFinesTotal.toFixed(2)}</strong>. Review the Overdue & Fines tab to issue reminders or collect clearance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('overdue')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                View Overdue Ledger
              </button>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="ed-metrics-grid">
            <div className="ed-metric-card">
              <span className="ed-metric-title">Catalog Titles</span>
              <span className="ed-metric-value">{stats.totalBooks}</span>
              <span className="ed-metric-subtitle">Distinct book titles in repository</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Total Volumes (Stock)</span>
              <span className="ed-metric-value">{stats.totalCopies}</span>
              <span className="ed-metric-subtitle">Physical copies registered</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Available on Shelf</span>
              <span className="ed-metric-value" style={{ color: '#16a34a' }}>
                {stats.availableCopies}
              </span>
              <span className="ed-metric-subtitle">Ready for immediate issue</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Actively Borrowed</span>
              <span className="ed-metric-value" style={{ color: '#2563eb' }}>
                {stats.issuedCopies}
              </span>
              <span className="ed-metric-subtitle">In possession of students</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Overdue Borrowings</span>
              <span className="ed-metric-value" style={{ color: stats.overdueBooks > 0 ? '#dc2626' : undefined }}>
                {stats.overdueBooks}
              </span>
              <span className="ed-metric-subtitle">Requires return action</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Registered Borrowers</span>
              <span className="ed-metric-value">{stats.registeredMembers}</span>
              <span className="ed-metric-subtitle">Active student library members</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Outstanding Fines</span>
              <span className="ed-metric-value" style={{ color: '#d97706' }}>
                ₹{stats.pendingFinesTotal.toFixed(2)}
              </span>
              <span className="ed-metric-subtitle">Pending fee clearance</span>
            </div>

            <div className="ed-metric-card">
              <span className="ed-metric-title">Total Fines Collected</span>
              <span className="ed-metric-value" style={{ color: '#059669' }}>
                ₹{stats.collectedFinesTotal.toFixed(2)}
              </span>
              <span className="ed-metric-subtitle">Processed fine revenues</span>
            </div>
          </div>

          {/* Quick Circulation Overview Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Lendings */}
            <div className="ed-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-emerald-700" />
                  Recent Book Issues
                </h3>
                <button
                  onClick={() => setActiveTab('circulation')}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {stats.recentIssues?.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No recent issue transactions recorded.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recentIssues?.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{item.book?.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.student?.user?.firstName} {item.student?.user?.lastName} (Adm: {item.student?.admissionNumber})
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                        <span className="ed-badge ed-badge-teal text-[11px]">Issued</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Popular / Most Issued Books */}
            <div className="ed-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-600" />
                  Most Popular Titles
                </h3>
                <span className="text-xs text-slate-500">By historical circulation</span>
              </div>

              {stats.popularBooks?.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">Circulation statistics will appear here.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.popularBooks?.slice(0, 5).map((book: any, idx: number) => (
                    <div key={book.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{book.title}</p>
                          <p className="text-xs text-slate-500">{book.author} • {book.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800">{book.circulationCount} checkouts</span>
                        <span className="text-[11px] text-slate-500 block">
                          Stock: {book.availableCopies}/{book.totalCopies}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: BOOK INVENTORY CATALOG */}
      {/* ==================================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="ed-toolbar">
            <div className="ed-toolbar-left">
              <div className="ed-search-box">
                <Search size={16} className="ed-search-icon" />
                <input
                  type="text"
                  placeholder="Search by title, author, ISBN, shelf..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="ed-input"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setBookPage(1);
                }}
                className="ed-select"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setBookPage(1);
                }}
                className="ed-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <button
                onClick={loadBooks}
                className="ed-btn ed-btn-outline"
                title="Refresh inventory"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-600">
              Showing <strong>{books.length}</strong> of <strong>{totalBooksCount}</strong> catalog titles
            </div>
          </div>

          {/* Table */}
          <div className="ed-table-container">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Book Title & Details</th>
                  <th>Category</th>
                  <th>ISBN & Shelf</th>
                  <th>Total Stock</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-700 border-t-transparent mb-2" />
                      <p className="text-xs text-slate-500">Loading catalog from PostgreSQL...</p>
                    </td>
                  </tr>
                ) : books.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No books found matching criteria</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try clearing search filters or click "Seed 30 Sample Books" in header.
                      </p>
                    </td>
                  </tr>
                ) : (
                  books.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {b.coverUrl ? (
                            <img
                              src={b.coverUrl}
                              alt={b.title}
                              className="w-10 h-14 object-cover rounded shadow-xs border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-14 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
                              {b.title.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{b.title}</p>
                            <p className="text-xs text-slate-500">{b.author}</p>
                            <span className="text-[10px] text-slate-400">
                              {b.edition || '1st Ed.'} • {b.publicationYear || '2024'} • {b.language || 'English'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="ed-badge ed-badge-teal">{b.category}</span>
                      </td>

                      <td>
                        <p className="font-mono text-xs text-slate-700">{b.isbn || '—'}</p>
                        <span className="text-[11px] text-slate-500 block">{b.shelfLocation || 'Unassigned'}</span>
                      </td>

                      <td className="font-semibold text-slate-800">{b.totalCopies}</td>

                      <td>
                        <span
                          className={`font-bold ${
                            b.availableCopies > 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {b.availableCopies}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`ed-badge ${
                            b.availableCopies > 0 ? 'ed-badge-teal' : 'ed-badge-neutral'
                          }`}
                        >
                          {b.availableCopies > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditBook(b)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                            title="Edit Book Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(b.id, b.title)}
                            className="p-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="Delete Book"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: CIRCULATION (ISSUES & RETURNS) */}
      {/* ==================================================================== */}
      {activeTab === 'circulation' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="ed-toolbar">
            <div className="ed-toolbar-left">
              <select
                value={issueStatusFilter}
                onChange={(e) => {
                  setIssueStatusFilter(e.target.value);
                  setIssuePage(1);
                }}
                className="ed-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="ISSUED">Currently Issued / Active</option>
                <option value="RETURNED">Returned</option>
                <option value="OVERDUE">Overdue</option>
                <option value="LOST">Lost</option>
              </select>

              <button onClick={loadIssues} className="ed-btn ed-btn-outline">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-600">
              Total Recorded Transactions: <strong>{totalIssuesCount}</strong>
            </div>
          </div>

          {/* Active Lendings Table */}
          <div className="ed-table-container">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Student Borrower</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Fine (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-700 border-t-transparent mb-2" />
                      <p className="text-xs text-slate-500">Loading circulation records...</p>
                    </td>
                  </tr>
                ) : issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No circulation records found</p>
                      <button
                        onClick={handleOpenIssueModal}
                        className="mt-3 ed-btn ed-btn-primary cursor-pointer text-xs"
                      >
                        Issue First Book
                      </button>
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => {
                    const isOverdue = issue.status === 'ISSUED' && new Date(issue.dueDate).getTime() < Date.now();
                    return (
                      <tr key={issue.id}>
                        <td>
                          <p className="font-bold text-slate-900 text-sm">{issue.book?.title}</p>
                          <span className="text-xs text-slate-500">{issue.book?.author} • {issue.book?.category}</span>
                        </td>

                        <td>
                          <p className="font-semibold text-slate-800 text-sm">
                            {issue.student?.user?.firstName} {issue.student?.user?.lastName}
                          </p>
                          <span className="text-[11px] text-slate-500 block">
                            Adm: {issue.student?.admissionNumber}
                          </span>
                        </td>

                        <td className="text-xs text-slate-700">
                          {new Date(issue.issueDate).toLocaleDateString()}
                        </td>

                        <td>
                          <span className="text-xs font-semibold block text-slate-800">
                            {new Date(issue.dueDate).toLocaleDateString()}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] text-rose-600 font-bold">
                              OVERDUE
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={`ed-badge ${
                              issue.status === 'RETURNED'
                                ? 'ed-badge-teal'
                                : isOverdue
                                ? 'ed-badge-warning'
                                : 'ed-badge-neutral'
                            }`}
                          >
                            {isOverdue ? 'OVERDUE' : issue.status}
                          </span>
                        </td>

                        <td>
                          {issue.fineAmount > 0 ? (
                            <div>
                              <span className="font-bold text-amber-700 text-xs">
                                ₹{issue.fineAmount.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-500 block font-semibold">
                                {issue.fineStatus}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          {issue.status === 'ISSUED' ? (
                            <button
                              onClick={() => handleOpenReturnModal(issue)}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Process Return
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Closed on {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: OVERDUE & FINE MANAGEMENT */}
      {/* ==================================================================== */}
      {activeTab === 'overdue' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Overdue Borrowings & Fine Collection Desk</h3>
              <p className="text-xs text-slate-600">
                Statutory fine rate: <strong>₹{settings.finePerDay}/day</strong> after <strong>{settings.gracePeriodDays} day</strong> grace period (Capped at ₹{settings.maxFineAmount}).
              </p>
            </div>
            <button onClick={loadOverdue} className="ed-btn ed-btn-outline text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Overdue
            </button>
          </div>

          <div className="ed-table-container">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Student Borrower</th>
                  <th>Overdue Book Title</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Accrued Fine</th>
                  <th>Fine Status</th>
                  <th style={{ textAlign: 'right' }}>Desk Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-700 border-t-transparent mb-2" />
                      <p className="text-xs text-slate-500">Checking overdue records...</p>
                    </td>
                  </tr>
                ) : overdueList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No overdue books at this time</p>
                      <p className="text-xs text-slate-500 mt-1">All borrowed volumes are within their loan periods.</p>
                    </td>
                  </tr>
                ) : (
                  overdueList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-bold text-slate-900 text-sm">
                          {item.student?.user?.firstName} {item.student?.user?.lastName}
                        </p>
                        <span className="text-xs text-slate-500">Adm: {item.student?.admissionNumber}</span>
                      </td>

                      <td>
                        <p className="font-semibold text-slate-800 text-sm">{item.book?.title}</p>
                        <span className="text-xs text-slate-500">{item.book?.author}</span>
                      </td>

                      <td className="text-xs font-mono text-rose-600 font-semibold">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>

                      <td className="font-bold text-rose-700 text-xs">
                        {item.overdueDays} days late
                      </td>

                      <td className="font-bold text-slate-900 text-sm">
                        ₹{item.accruedFine?.toFixed(2) || '0.00'}
                      </td>

                      <td>
                        <span className="ed-badge ed-badge-warning">{item.fineStatus}</span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReturnModal(item)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer"
                          >
                            Return & Collect
                          </button>
                          <button
                            onClick={() => handleUpdateFine(item.id, 'WAIVED')}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded cursor-pointer"
                            title="Principal / Medical Waive"
                          >
                            Waive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: STUDENT HISTORY DOSSIER */}
      {/* ==================================================================== */}
      {activeTab === 'student_history' && (
        <div className="space-y-6">
          <div className="ed-card p-5">
            <h3 className="font-bold text-slate-900 mb-2">Student Library Profile & History Lookup</h3>
            <p className="text-xs text-slate-500 mb-4">
              Search by student to view active borrowings, historical returns, condition notes, and fine records.
            </p>

            <div className="flex items-center gap-3 max-w-xl">
              <select
                className="ed-select flex-1"
                onChange={(e) => handleSearchStudentDossier(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>-- Select a Student Member --</option>
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user?.firstName} {s.user?.lastName} ({s.admissionNumber || s.id.slice(0, 8)})
                  </option>
                ))}
              </select>
              <button
                onClick={loadStudentsForIssue}
                className="ed-btn ed-btn-outline text-xs"
              >
                Refresh Members
              </button>
            </div>
          </div>

          {dossierLoading ? (
            <div className="ed-card p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-700 border-t-transparent mb-2" />
              <p className="text-xs text-slate-500">Retrieving student library records...</p>
            </div>
          ) : selectedStudentDossier ? (
            <div className="space-y-6">
              {/* Profile Summary Card */}
              <div className="ed-card p-5 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">Student Member</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedStudentDossier.student?.user?.firstName} {selectedStudentDossier.student?.user?.lastName}
                  </p>
                  <span className="text-xs font-mono text-slate-600">
                    Adm: {selectedStudentDossier.student?.admissionNumber}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Currently Borrowed</span>
                  <p className="font-bold text-emerald-700 text-lg">
                    {selectedStudentDossier.activeIssues?.length || 0} / {settings.maxBooksPerStudent} books
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Total Past Returns</span>
                  <p className="font-bold text-slate-800 text-lg">
                    {selectedStudentDossier.pastIssues?.length || 0} books
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Pending Fines</span>
                  <p className="font-bold text-amber-700 text-lg">
                    ₹{selectedStudentDossier.totalFinesPending?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              {/* Active Lendings */}
              <div className="ed-card p-5">
                <h4 className="font-bold text-slate-900 text-sm mb-3">Active Borrowings</h4>
                {selectedStudentDossier.activeIssues?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No active books currently borrowed.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedStudentDossier.activeIssues.map((issue: any) => (
                      <div key={issue.id} className="py-2.5 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{issue.book?.title}</p>
                          <span className="text-xs text-slate-500">{issue.book?.author} • Shelf: {issue.book?.shelfLocation}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold block text-slate-700">
                            Due: {new Date(issue.dueDate).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleOpenReturnModal(issue)}
                            className="mt-1 px-2.5 py-0.5 bg-emerald-700 text-white rounded text-xs cursor-pointer"
                          >
                            Return
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Returns */}
              <div className="ed-card p-5">
                <h4 className="font-bold text-slate-900 text-sm mb-3">Historical Borrowing Ledger</h4>
                {selectedStudentDossier.pastIssues?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No past return transactions on file.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedStudentDossier.pastIssues.map((issue: any) => (
                      <div key={issue.id} className="py-2.5 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{issue.book?.title}</p>
                          <span className="text-xs text-slate-500">
                            Condition: <strong>{issue.returnCondition || 'GOOD'}</strong>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">
                            Returned: {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '—'}
                          </span>
                          {issue.fineAmount > 0 && (
                            <span className="text-[11px] font-semibold text-amber-700">
                              Fine: ₹{issue.fineAmount} ({issue.fineStatus})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="ed-card p-8 text-center text-slate-400">
              <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Select a student above to inspect their borrowing dossier</p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: REPORTS & EXPORTS */}
      {/* ==================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="ed-card p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-2">Dynamic Institutional Library Reports</h3>
            <p className="text-xs text-slate-500 mb-4">
              Generate real-time database reports for audit, stock inventory, circulation compliance, and fine reconciliation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Report Module</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="ed-select w-full"
                >
                  <option value="INVENTORY">Full Book Inventory Catalog</option>
                  <option value="AVAILABLE_STOCK">Available Stock Roster</option>
                  <option value="ISSUED_BOOKS">Actively Issued Volumes</option>
                  <option value="RETURNED_BOOKS">Returned Volumes Ledger</option>
                  <option value="OVERDUE_BOOKS">Overdue Lendings Report</option>
                  <option value="FINES">Overdue Fines & Collections</option>
                  <option value="CATEGORY_WISE">Subject Category Distribution</option>
                  <option value="TRANSACTIONS">Complete Circulation Transactions</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Category Filter</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="ed-select w-full"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date (Optional)</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="ed-input w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="ed-input w-full"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handleGenerateReport}
                disabled={actionLoading}
                className="ed-btn ed-btn-primary cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Generate Live Report
              </button>

              {reportResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCsv}
                    className="ed-btn ed-btn-secondary cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="ed-btn ed-btn-outline cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Report Results Preview */}
          {reportResult && (
            <div className="ed-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {reportResult.reportType} REPORT PREVIEW
                  </h4>
                  <span className="text-xs text-slate-500">
                    Generated: {new Date(reportResult.generatedAt).toLocaleString()} • {reportResult.totalRecords} total records
                  </span>
                </div>
                <span className="ed-badge ed-badge-teal">PostgreSQL Real-time Query</span>
              </div>

              {/* Data Table */}
              <div className="ed-table-container">
                <table className="ed-table">
                  <thead>
                    <tr>
                      {reportResult.data?.length > 0 &&
                        Object.keys(reportResult.data[0]).map((col) => (
                          <th key={col} className="capitalize">
                            {col.replace(/([A-Z])/g, ' $1')}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportResult.data?.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                          No records found matching report criteria.
                        </td>
                      </tr>
                    ) : (
                      reportResult.data?.slice(0, 50).map((row: any, idx: number) => (
                        <tr key={idx}>
                          {Object.values(row).map((val: any, cIdx: number) => (
                            <td key={cIdx} className="text-xs">
                              {typeof val === 'number'
                                ? val % 1 !== 0
                                  ? val.toFixed(2)
                                  : val
                                : String(val ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: SETTINGS & POLICIES */}
      {/* ==================================================================== */}
      {activeTab === 'settings' && (
        <div className="ed-card p-6 max-w-2xl">
          <h3 className="font-bold text-slate-900 mb-1">Library Lending Policies & Fine Configuration</h3>
          <p className="text-xs text-slate-500 mb-6">
            Customize default circulation rules, borrowing quotas, grace periods, and overdue fee schedules.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Fine Rate Per Day (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={settings.finePerDay}
                onChange={(e) => setSettings({ ...settings, finePerDay: Number(e.target.value) })}
                className="ed-input w-full"
                required
              />
              <span className="text-[11px] text-slate-500">Statutory fine charged per overdue calendar day</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Grace Period (Days)
              </label>
              <input
                type="number"
                min="0"
                value={settings.gracePeriodDays}
                onChange={(e) => setSettings({ ...settings, gracePeriodDays: Number(e.target.value) })}
                className="ed-input w-full"
                required
              />
              <span className="text-[11px] text-slate-500">Days allowed past due date before fines begin accruing</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Maximum Overdue Fine Cap (₹)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={settings.maxFineAmount}
                onChange={(e) => setSettings({ ...settings, maxFineAmount: Number(e.target.value) })}
                className="ed-input w-full"
                required
              />
              <span className="text-[11px] text-slate-500">Upper cap on fines per overdue volume</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Maximum Books Borrowable Per Student
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxBooksPerStudent}
                onChange={(e) => setSettings({ ...settings, maxBooksPerStudent: Number(e.target.value) })}
                className="ed-input w-full"
                required
              />
              <span className="text-[11px] text-slate-500">Enforced active borrowing quota</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Standard Loan Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                value={settings.loanDurationDays}
                onChange={(e) => setSettings({ ...settings, loanDurationDays: Number(e.target.value) })}
                className="ed-input w-full"
                required
              />
              <span className="text-[11px] text-slate-500">Default lending period prefilled on Quick Issue</span>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={actionLoading}
                className="ed-btn ed-btn-primary cursor-pointer"
              >
                Save Policies & Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: ADD / EDIT BOOK */}
      {/* ==================================================================== */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title={editingBook ? `Edit Book: ${editingBook.title}` : 'Add New Book to Catalog'}
      >
        <form onSubmit={handleSaveBook} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Title *</label>
            <input
              type="text"
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              className="ed-input w-full"
              placeholder="e.g. Higher Secondary Physics Volume 1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Author *</label>
              <input
                type="text"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                className="ed-input w-full"
                placeholder="e.g. Prof. H.C. Verma"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Category *</label>
              <select
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                className="ed-select w-full"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ISBN</label>
              <input
                type="text"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                className="ed-input w-full"
                placeholder="e.g. 978-81-7709-187-8"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Publisher</label>
              <input
                type="text"
                value={bookForm.publisher}
                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                className="ed-input w-full"
                placeholder="e.g. Bharati Bhawan"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Edition</label>
              <input
                type="text"
                value={bookForm.edition}
                onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })}
                className="ed-input w-full"
                placeholder="e.g. 2nd Revised Ed."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Year</label>
              <input
                type="number"
                value={bookForm.publicationYear}
                onChange={(e) => setBookForm({ ...bookForm, publicationYear: Number(e.target.value) })}
                className="ed-input w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Language</label>
              <input
                type="text"
                value={bookForm.language}
                onChange={(e) => setBookForm({ ...bookForm, language: e.target.value })}
                className="ed-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Total Copies (Stock)</label>
              <input
                type="number"
                min="1"
                value={bookForm.totalCopies}
                onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })}
                className="ed-input w-full"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Shelf Location</label>
              <input
                type="text"
                value={bookForm.shelfLocation}
                onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
                className="ed-input w-full"
                placeholder="e.g. Science Wing - Bay 4"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Book Cover Image URL</label>
            <input
              type="url"
              value={bookForm.coverUrl}
              onChange={(e) => setBookForm({ ...bookForm, coverUrl: e.target.value })}
              className="ed-input w-full"
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description / Summary</label>
            <textarea
              value={bookForm.description}
              onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              className="ed-input w-full h-20"
              placeholder="Brief synopsis of book syllabus and concepts..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowBookModal(false)}
              className="ed-btn ed-btn-outline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="ed-btn ed-btn-primary cursor-pointer"
            >
              {editingBook ? 'Save Changes' : 'Register Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 2: QUICK ISSUE BOOK */}
      {/* ==================================================================== */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Quick Issue Library Book"
      >
        <form onSubmit={handleProcessIssue} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Select Student Member *</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="ed-select w-full"
              required
            >
              <option value="">-- Choose Student --</option>
              {studentsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user?.firstName} {s.user?.lastName} (Adm: {s.admissionNumber || s.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Select Available Book *</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="ed-select w-full"
              required
            >
              <option value="">-- Choose Book in Stock --</option>
              {availableBooksList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.author} ({b.availableCopies} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Statutory Due Date *</label>
            <input
              type="date"
              value={issueDueDate}
              onChange={(e) => setIssueDueDate(e.target.value)}
              className="ed-input w-full"
              required
            />
            <span className="text-[11px] text-slate-500">
              Defaulted to {settings.loanDurationDays} days based on school library policy
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Librarian Notes (Optional)</label>
            <input
              type="text"
              value={issueNotes}
              onChange={(e) => setIssueNotes(e.target.value)}
              className="ed-input w-full"
              placeholder="e.g. Issued for science project preparation"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowIssueModal(false)}
              className="ed-btn ed-btn-outline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="ed-btn ed-btn-primary cursor-pointer"
            >
              Confirm Issue
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 3: PROCESS RETURN & FINE */}
      {/* ==================================================================== */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Process Book Return & Inspection"
      >
        {returningIssue && (
          <form onSubmit={handleProcessReturn} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <p>
                <strong>Book:</strong> {returningIssue.book?.title}
              </p>
              <p>
                <strong>Borrower:</strong> {returningIssue.student?.user?.firstName} {returningIssue.student?.user?.lastName}
              </p>
              <p>
                <strong>Due Date:</strong> {new Date(returningIssue.dueDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Inspected Physical Condition
              </label>
              <select
                value={returnCondition}
                onChange={(e: any) => setReturnCondition(e.target.value)}
                className="ed-select w-full"
              >
                <option value="GOOD">GOOD — Normal wear & tear (Restock to available)</option>
                <option value="DAMAGED">DAMAGED — Binding/pages damaged (Restocked, penalty flag)</option>
                <option value="LOST">LOST — Volume reported missing (Do not restock)</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-900">
                <input
                  type="checkbox"
                  checked={waiveFine}
                  onChange={(e) => setWaiveFine(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                Waive Overdue Fines for this transaction
              </label>
              <span className="text-[11px] text-amber-700 block mt-1">
                Authorized for medical leave or Principal special permissions.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Inspection Notes</label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="ed-input w-full"
                placeholder="e.g. Returned on time, pristine condition"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="ed-btn ed-btn-outline cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="ed-btn ed-btn-primary cursor-pointer"
              >
                Complete Return
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

