import React, { useState, useEffect } from 'react';
import {
  Bot,
  MessageSquare,
  HelpCircle,
  Share2,
  Users,
  Settings,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Save,
  RotateCcw,
  Check,
  RefreshCw,
} from 'lucide-react';
import { chatbotApi } from '../../services/api.js';

const FAQ_CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'ADMISSIONS', label: 'Admissions' },
  { value: 'FEES', label: 'Fees & Payments' },
  { value: 'ACADEMICS', label: 'Academics & Curriculum' },
  { value: 'FACILITIES', label: 'Campus & Facilities' },
  { value: 'TIMINGS_HOLIDAYS', label: 'Timings & Holidays' },
  { value: 'EXAMINATIONS', label: 'Examinations' },
  { value: 'GENERAL', label: 'General Enquiries' },
];

export const ChatbotFaqManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faqs' | 'personality' | 'whatsapp' | 'escalations'>('faqs');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // FAQs State (guaranteed to be an array)
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('ALL');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqFormData, setFaqFormData] = useState({
    question: '',
    answer: '',
    category: 'ADMISSIONS',
    displayOrder: 0,
    isPublished: true,
  });

  // Config State
  const [config, setConfig] = useState<any>({
    botName: 'EduNexa AI Assistant',
    welcomeMessage: 'Hello! Welcome to our school. How can I help you today?',
    suggestedQuestions: [
      'What are the admission procedures & eligibility?',
      'What is the annual fee structure?',
      'What classes and streams are offered?',
      'What campus facilities and sports are available?',
      'What are school working hours and holidays?',
    ],
    fallbackMessage:
      'I do not have specific information about that yet. Please connect with our admissions office or submit an enquiry.',
    whatsappNumber: '',
    whatsappPrefillText: 'Hello, I have an enquiry regarding school admission.',
    whatsappEnabled: false,
    escalationEnabled: true,
    escalationContactName: 'Admissions & Counseling Desk',
    escalationEmail: '',
    escalationPhone: '',
    escalationAvailability: 'Monday to Saturday, 9:00 AM - 4:00 PM',
    escalationMessage: 'Our admissions desk has received your request and will contact you shortly.',
  });

  const [newSuggestedQuestion, setNewSuggestedQuestion] = useState('');

  // Escalations State (guaranteed to be an array)
  const [escalations, setEscalations] = useState<any[]>([]);
  const [escalationStatusFilter, setEscalationStatusFilter] = useState('ALL');
  const [escalationSearchQuery, setEscalationSearchQuery] = useState('');
  const [selectedEscalation, setSelectedEscalation] = useState<any | null>(null);
  const [escalationNotes, setEscalationNotes] = useState('');
  const [updatingEscalationStatus, setUpdatingEscalationStatus] = useState<string>('PENDING');

  useEffect(() => {
    loadAllData();
  }, []);

  const parseSuggestedQuestions = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [
      'What are the admission procedures & eligibility?',
      'What is the annual fee structure?',
      'What classes and streams are offered?',
      'What campus facilities and sports are available?',
      'What are school working hours and holidays?',
    ];
  };

  const loadAllData = async () => {
    setLoading(true);
    setAlert(null);
    try {
      // Load FAQs safely
      try {
        const faqsRes = await chatbotApi.listFaqs();
        const items = Array.isArray(faqsRes) ? faqsRes : (faqsRes?.data?.items || faqsRes?.data || faqsRes?.items || []);
        setFaqs(Array.isArray(items) ? items : []);
      } catch (err: any) {
        console.warn('Failed to fetch FAQs:', err);
      }

      // Load Config safely
      try {
        const cfgRes = await chatbotApi.getConfig();
        const cfgData = cfgRes?.data || cfgRes;
        if (cfgData && typeof cfgData === 'object' && !cfgData.error && cfgData.botName) {
          setConfig((prev: any) => ({
            ...prev,
            ...cfgData,
            suggestedQuestions: parseSuggestedQuestions(cfgData.suggestedQuestions || prev.suggestedQuestions),
          }));
        }
      } catch (err: any) {
        console.warn('Failed to fetch Config:', err);
      }

      // Load Escalations safely
      try {
        const escRes = await chatbotApi.listEscalations();
        const items = Array.isArray(escRes) ? escRes : (escRes?.data?.items || escRes?.data || escRes?.items || []);
        setEscalations(Array.isArray(items) ? items : []);
      } catch (err: any) {
        console.warn('Failed to fetch Escalations:', err);
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Failed to load chatbot data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const safeConfig = {
        ...config,
        suggestedQuestions: parseSuggestedQuestions(config.suggestedQuestions),
      };
      const updated = await chatbotApi.updateConfig(safeConfig);
      if (updated) {
        setConfig({
          ...updated,
          suggestedQuestions: parseSuggestedQuestions(updated.suggestedQuestions),
        });
      }
      setAlert({ type: 'success', message: 'Chatbot settings saved successfully!' });
      setTimeout(() => setAlert(null), 3500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFaqModal = (faq?: any) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        category: faq.category || 'ADMISSIONS',
        displayOrder: faq.displayOrder || 0,
        isPublished: faq.isPublished !== undefined ? faq.isPublished : true,
      });
    } else {
      setEditingFaq(null);
      setFaqFormData({
        question: '',
        answer: '',
        category: 'ADMISSIONS',
        displayOrder: (Array.isArray(faqs) ? faqs.length : 0) + 1,
        isPublished: true,
      });
    }
    setShowFaqModal(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqFormData.question.trim() || !faqFormData.answer.trim()) {
      setAlert({ type: 'error', message: 'Question and Answer are required' });
      return;
    }

    try {
      setSaving(true);
      if (editingFaq) {
        const updated = await chatbotApi.updateFaq(editingFaq.id, faqFormData);
        setFaqs((prev) => (Array.isArray(prev) ? prev.map((f) => (f.id === updated.id ? updated : f)) : [updated]));
        setAlert({ type: 'success', message: 'FAQ updated successfully!' });
      } else {
        const created = await chatbotApi.createFaq(faqFormData);
        setFaqs((prev) => (Array.isArray(prev) ? [...prev, created] : [created]));
        setAlert({ type: 'success', message: 'FAQ created successfully!' });
      }
      setShowFaqModal(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Failed to save FAQ' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublishFaq = async (faq: any) => {
    try {
      const updated = await chatbotApi.updateFaq(faq.id, { isPublished: !faq.isPublished });
      setFaqs((prev) => (Array.isArray(prev) ? prev.map((f) => (f.id === updated.id ? updated : f)) : []));
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Failed to update FAQ status' });
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await chatbotApi.deleteFaq(id);
      setFaqs((prev) => (Array.isArray(prev) ? prev.filter((f) => f.id !== id) : []));
      setAlert({ type: 'success', message: 'FAQ removed' });
      setTimeout(() => setAlert(null), 2500);
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Failed to delete FAQ' });
    }
  };

  const handleAddSuggestedQuestion = () => {
    const q = newSuggestedQuestion.trim();
    if (!q) return;
    const current = parseSuggestedQuestions(config.suggestedQuestions);
    if (current.includes(q)) return;
    setConfig({
      ...config,
      suggestedQuestions: [...current, q],
    });
    setNewSuggestedQuestion('');
  };

  const handleRemoveSuggestedQuestion = (index: number) => {
    const current = parseSuggestedQuestions(config.suggestedQuestions);
    const next = [...current];
    next.splice(index, 1);
    setConfig({ ...config, suggestedQuestions: next });
  };

  const handleUpdateEscalation = async () => {
    if (!selectedEscalation) return;
    try {
      setSaving(true);
      const updated = await chatbotApi.updateEscalationStatus(selectedEscalation.id, {
        status: updatingEscalationStatus as any,
        staffNotes: escalationNotes,
      });
      setEscalations((prev) =>
        Array.isArray(prev) ? prev.map((e) => (e.id === updated.id ? updated : e)) : [updated]
      );
      setSelectedEscalation(null);
      setAlert({ type: 'success', message: 'Escalation ticket updated!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Failed to update escalation ticket' });
    } finally {
      setSaving(false);
    }
  };

  // Safe Arrays for Filtering & Rendering
  const safeFaqs = Array.isArray(faqs) ? faqs.filter(Boolean) : [];
  const safeEscalations = Array.isArray(escalations) ? escalations.filter(Boolean) : [];
  const safeSuggestedQuestions = parseSuggestedQuestions(config?.suggestedQuestions);

  // Filtered FAQs
  const filteredFaqs = safeFaqs.filter((faq) => {
    if (!faq) return false;
    const matchesCat = faqCategoryFilter === 'ALL' || faq.category === faqCategoryFilter;
    const qLower = String(faq.question || '').toLowerCase();
    const aLower = String(faq.answer || '').toLowerCase();
    const searchLower = (faqSearchQuery || '').toLowerCase();
    const matchesSearch = !searchLower || qLower.includes(searchLower) || aLower.includes(searchLower);
    return matchesCat && matchesSearch;
  });

  // Filtered Escalations
  const filteredEscalations = safeEscalations.filter((esc) => {
    if (!esc) return false;
    const matchesStatus = escalationStatusFilter === 'ALL' || esc.status === escalationStatusFilter;
    const nameLower = String(esc.visitorName || '').toLowerCase();
    const phoneStr = String(esc.visitorPhone || '');
    const queryLower = String(esc.query || '').toLowerCase();
    const searchLower = (escalationSearchQuery || '').toLowerCase();
    const matchesSearch =
      !searchLower ||
      nameLower.includes(searchLower) ||
      phoneStr.includes(searchLower) ||
      queryLower.includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#fef3c7', text: '#92400e', label: 'Pending Review' };
      case 'IN_PROGRESS':
        return { bg: '#dbeafe', text: '#1e40af', label: 'In Progress' };
      case 'RESOLVED':
        return { bg: '#dcfce7', text: '#166534', label: 'Resolved' };
      case 'DISMISSED':
        return { bg: '#f1f5f9', text: '#64748b', label: 'Dismissed' };
      default:
        return { bg: '#f1f5f9', text: '#64748b', label: status || 'Unknown' };
    }
  };

  const safeFormatDate = (val: any) => {
    try {
      if (!val) return 'Recently';
      const d = new Date(val);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', minHeight: '80vh' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: 0,
            }}
          >
            <Bot size={28} style={{ color: 'var(--brand-primary, #1e3a8a)' }} />
            AI Chatbot & FAQ Knowledge Base
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.90rem', marginTop: '6px', marginBottom: 0 }}>
            Configure grounded school AI responses, manage public FAQs, WhatsApp click-to-chat, and visitor counselor escalations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadAllData}
            disabled={loading}
            style={{
              padding: '8px 14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#475569',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <RotateCcw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alert && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: alert.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: alert.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${alert.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: '0.88rem' }}>{alert.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '24px',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveTab('faqs')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'faqs' ? '2px solid var(--brand-primary, #1e3a8a)' : '2px solid transparent',
            color: activeTab === 'faqs' ? 'var(--brand-primary, #1e3a8a)' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          <HelpCircle size={18} />
          <span>FAQ Knowledge Base ({safeFaqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('personality')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom:
              activeTab === 'personality' ? '2px solid var(--brand-primary, #1e3a8a)' : '2px solid transparent',
            color: activeTab === 'personality' ? 'var(--brand-primary, #1e3a8a)' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={18} />
          <span>Bot Personality & Prompts</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom:
              activeTab === 'whatsapp' ? '2px solid var(--brand-primary, #1e3a8a)' : '2px solid transparent',
            color: activeTab === 'whatsapp' ? 'var(--brand-primary, #1e3a8a)' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          <MessageCircle size={18} />
          <span>WhatsApp Channel</span>
        </button>

        <button
          onClick={() => setActiveTab('escalations')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom:
              activeTab === 'escalations' ? '2px solid var(--brand-primary, #1e3a8a)' : '2px solid transparent',
            color: activeTab === 'escalations' ? 'var(--brand-primary, #1e3a8a)' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={18} />
          <span>Counselor Escalations ({safeEscalations.filter((e) => e?.status === 'PENDING').length} Pending)</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: '0.90rem' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#1e3a8a' }} />
          <div>Loading chatbot configuration and knowledge base...</div>
        </div>
      )}

      {/* TAB 1: FAQ KNOWLEDGE BASE */}
      {!loading && activeTab === 'faqs' && (
        <div>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              backgroundColor: '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search questions or answers..."
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <select
                value={faqCategoryFilter}
                onChange={(e) => setFaqCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  backgroundColor: '#ffffff',
                }}
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenFaqModal()}
              style={{
                backgroundColor: 'var(--brand-primary, #1e3a8a)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} />
              <span>Add New FAQ</span>
            </button>
          </div>

          {/* FAQs List */}
          {filteredFaqs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
              }}
            >
              <HelpCircle size={40} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', margin: '0 0 6px 0' }}>No FAQs Found</h3>
              <p style={{ fontSize: '0.86rem', marginTop: '4px', marginBottom: '16px' }}>
                {faqSearchQuery || faqCategoryFilter !== 'ALL'
                  ? 'Try modifying your search or category filters.'
                  : 'Start adding questions and answers to ground the school AI assistant.'}
              </p>
              <button
                onClick={() => handleOpenFaqModal()}
                style={{
                  backgroundColor: 'var(--brand-primary, #1e3a8a)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add First FAQ
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {faq.category}
                      </span>
                      {faq.isPublished ? (
                        <span
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={12} />
                          Published
                        </span>
                      ) : (
                        <span
                          style={{
                            backgroundColor: '#fef2f2',
                            color: '#b91c1c',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <EyeOff size={12} />
                          Draft
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>
                      {faq.question}
                    </h4>

                    <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.5', whiteSpace: 'pre-line', margin: 0 }}>
                      {faq.answer}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleTogglePublishFaq(faq)}
                      title={faq.isPublished ? 'Unpublish' : 'Publish'}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: faq.isPublished ? '#15803d' : '#64748b',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500,
                      }}
                    >
                      {faq.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{faq.isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenFaqModal(faq)}
                      title="Edit FAQ"
                      style={{
                        padding: '6px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#334155',
                      }}
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      title="Delete FAQ"
                      style={{
                        padding: '6px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#dc2626',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOT PERSONALITY & PROMPTS */}
      {!loading && activeTab === 'personality' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0' }}>
              Assistant Identity & Welcome Messaging
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', marginBottom: '6px' }}>
                  Chatbot Display Name
                </label>
                <input
                  type="text"
                  value={config?.botName || ''}
                  onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.90rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', marginBottom: '6px' }}>
                  Welcome Greeting Message
                </label>
                <textarea
                  rows={3}
                  value={config?.welcomeMessage || ''}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.90rem',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  This message is immediately displayed when a website visitor opens the assistant.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', marginBottom: '6px' }}>
                  Fallback Response (When no match is found)
                </label>
                <textarea
                  rows={2}
                  value={config?.fallbackMessage || ''}
                  onChange={(e) => setConfig({ ...config, fallbackMessage: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.90rem',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Suggested Questions Manager */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>
              Suggested Prompt Chips
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.86rem', margin: '0 0 16px 0' }}>
              These clickable quick questions appear directly beneath the chatbot welcome message on the public website.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Enter a common question (e.g. What is the fee structure for 2026?)"
                value={newSuggestedQuestion}
                onChange={(e) => setNewSuggestedQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSuggestedQuestion();
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                }}
              />
              <button
                type="button"
                onClick={handleAddSuggestedQuestion}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={16} />
                <span>Add Chip</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {safeSuggestedQuestions.map((q: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: '#1e293b' }}>{q}</span>
                  <button
                    onClick={() => handleRemoveSuggestedQuestion(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              style={{
                backgroundColor: 'var(--brand-primary, #1e3a8a)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '0.90rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Save size={18} />
              <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: WHATSAPP INTEGRATION */}
      {!loading && activeTab === 'whatsapp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                  WhatsApp Enquiry & Direct Chat
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Allow parents to initiate instant WhatsApp chats with school admissions from the website floating button.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="whatsappToggle"
                  checked={config?.whatsappEnabled || false}
                  onChange={(e) => setConfig({ ...config, whatsappEnabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="whatsappToggle" style={{ fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer' }}>
                  Enable Floating WhatsApp Button on Public Website
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', marginBottom: '6px' }}>
                  School WhatsApp Contact Number (with country code)
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={config?.whatsappNumber || ''}
                  onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.90rem',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Include international dialing code without spaces or punctuation (e.g. +919876543210).
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', marginBottom: '6px' }}>
                  Default Pre-filled Message
                </label>
                <textarea
                  rows={2}
                  value={config?.whatsappPrefillText || ''}
                  onChange={(e) => setConfig({ ...config, whatsappPrefillText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.90rem',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {config?.whatsappNumber && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px 16px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageCircle size={18} style={{ color: '#16a34a' }} />
                    <span style={{ fontSize: '0.86rem', color: '#15803d', fontWeight: 600 }}>
                      Live Link Preview:
                    </span>
                    <span style={{ fontSize: '0.84rem', color: '#166534' }}>
                      https://wa.me/{String(config?.whatsappNumber || '').replace(/[^0-9]/g, '')}
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/${String(config?.whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      config?.whatsappPrefillText || ''
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.82rem',
                      color: '#15803d',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Test Chat</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              style={{
                backgroundColor: 'var(--brand-primary, #1e3a8a)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '0.90rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save WhatsApp Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: COUNSELOR ESCALATIONS */}
      {!loading && activeTab === 'escalations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Counselor Settings Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px 24px',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0' }}>
              Counselor Escalation Desk Settings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '6px' }}>
                  Counselor / Contact Name
                </label>
                <input
                  type="text"
                  value={config?.escalationContactName || ''}
                  onChange={(e) => setConfig({ ...config, escalationContactName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '6px' }}>
                  Counselor Phone Number
                </label>
                <input
                  type="text"
                  value={config?.escalationPhone || ''}
                  onChange={(e) => setConfig({ ...config, escalationPhone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '6px' }}>
                  Counselor Email Address
                </label>
                <input
                  type="email"
                  value={config?.escalationEmail || ''}
                  onChange={(e) => setConfig({ ...config, escalationEmail: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '6px' }}>
                  Counselor Office Hours
                </label>
                <input
                  type="text"
                  value={config?.escalationAvailability || ''}
                  onChange={(e) => setConfig({ ...config, escalationAvailability: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Updating...' : 'Update Desk Info'}
              </button>
            </div>
          </div>

          {/* Escalations Table */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Visitor Support & Callback Queue ({filteredEscalations.length})
              </h3>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search visitor name, phone..."
                  value={escalationSearchQuery}
                  onChange={(e) => setEscalationSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                  }}
                />
                <select
                  value={escalationStatusFilter}
                  onChange={(e) => setEscalationStatusFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>
            </div>

            {filteredEscalations.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px',
                  color: '#64748b',
                  fontSize: '0.88rem',
                }}
              >
                No escalation tickets found matching criteria.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Visitor</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Query / Context</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Submitted At</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Status</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Staff Notes</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEscalations.map((esc) => {
                      const badge = getStatusBadgeStyle(esc.status);
                      return (
                        <tr
                          key={esc.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{esc.visitorName}</div>
                            <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{esc.visitorPhone}</div>
                            {esc.visitorEmail && (
                              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{esc.visitorEmail}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', maxWidth: '300px' }}>
                            <p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{esc.query}</p>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {safeFormatDate(esc.createdAt)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.text,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.80rem' }}>
                            {esc.staffNotes || '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setSelectedEscalation(esc);
                                setUpdatingEscalationStatus(esc.status);
                                setEscalationNotes(esc.staffNotes || '');
                              }}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              Update Status
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
      )}

      {/* MODAL: ADD / EDIT FAQ */}
      {showFaqModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
              {editingFaq ? 'Edit FAQ Item' : 'Create Knowledge Base FAQ'}
            </h3>

            <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '4px' }}>
                  Category *
                </label>
                <select
                  value={faqFormData.category}
                  onChange={(e) => setFaqFormData({ ...faqFormData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                >
                  {FAQ_CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '4px' }}>
                  Question *
                </label>
                <input
                  type="text"
                  placeholder="e.g. What is the deadline for Grade 9 admission applications?"
                  value={faqFormData.question}
                  onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '4px' }}>
                  Answer (Grounded Response) *
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter the official, accurate answer..."
                  value={faqFormData.answer}
                  onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '4px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={faqFormData.displayOrder}
                    onChange={(e) => setFaqFormData({ ...faqFormData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="isPublishedModal"
                    checked={faqFormData.isPublished}
                    onChange={(e) => setFaqFormData({ ...faqFormData, isPublished: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isPublishedModal" style={{ fontWeight: 600, fontSize: '0.86rem', cursor: 'pointer' }}>
                    Publish to Public Chatbot
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: 'var(--brand-primary, #1e3a8a)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE ESCALATION STATUS */}
      {selectedEscalation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '540px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
              Update Escalation Ticket
            </h3>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{selectedEscalation.visitorName}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
                Phone: {selectedEscalation.visitorPhone} | Email: {selectedEscalation.visitorEmail || 'N/A'}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.84rem', color: '#334155' }}>
                <strong>Query:</strong> {selectedEscalation.query}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '4px' }}>
                  Ticket Status
                </label>
                <select
                  value={updatingEscalationStatus}
                  onChange={(e) => setUpdatingEscalationStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="IN_PROGRESS">In Progress / Contacted</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed / Spam</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: '4px' }}>
                  Staff Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record outcome of counselor phone call or notes for other staff..."
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedEscalation(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateEscalation}
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: 'var(--brand-primary, #1e3a8a)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Update Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
