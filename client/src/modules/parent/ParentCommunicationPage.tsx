import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useParentChild, ParentChildSwitcherBar } from '../../context/ParentChildContext.js';
import { portalsApi } from '../../services/api.js';

export const ParentCommunicationPage: React.FC = () => {
  const { selectedChild } = useParentChild();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compose Message State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await portalsApi.getMessages(selectedChild?.id);
      setMessages(Array.isArray(res) ? res : res?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve communication messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [selectedChild?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    try {
      setSending(true);
      await portalsApi.sendMessage({
        subject: subject.trim(),
        messageContent: content.trim(),
        studentProfileId: selectedChild?.id,
        channel: 'PORTAL',
      });
      setSubject('');
      setContent('');
      setSendSuccess(true);
      loadMessages();
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Universal Parent Child Switcher */}
      <ParentChildSwitcherBar />

      {/* Header Card */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Communication Desk</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct Faculty Messaging</span>
          </div>
          <h1 className="ed-page-header-title">
            <MessageSquare size={26} style={{ color: 'var(--color-primary)' }} />
            Teacher Communication & Dispatches
          </h1>
          <p className="ed-page-header-desc">
            Direct authenticated messaging with class teachers and administration regarding{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{selectedChild?.name || 'Selected Ward'}</strong>.
          </p>
        </div>

        <button
          className="ed-btn ed-btn-secondary"
          onClick={loadMessages}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {sendSuccess && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', color: '#15803d', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>Message dispatched successfully to faculty desk.</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Messages List */}
        <div className="ed-card">
          <div className="ed-card-header">
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Inbox & Outbox</h3>
          </div>
          <div className="ed-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading conversation messages...
              </div>
            ) : messages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    style={{
                      padding: '14px 18px',
                      borderBottom: idx === messages.length - 1 ? 'none' : '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {msg.subject}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {msg.messageContent}
                    </p>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      From: {msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Sender'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                No message threads found. Use the dispatch composer to write to teachers.
              </div>
            )}
          </div>
        </div>

        {/* Dispatch Composer */}
        <div className="ed-card">
          <div className="ed-card-header">
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Compose New Dispatch</h3>
          </div>
          <form onSubmit={handleSendMessage} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Regarding Student
              </label>
              <input
                type="text"
                disabled
                value={selectedChild ? `${selectedChild.name} (${selectedChild.className}-${selectedChild.sectionName})` : 'All Wards'}
                className="ed-input"
                style={{ width: '100%', backgroundColor: 'var(--bg-subtle)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Subject / Topic *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Inquiry regarding Mathematics term syllabus"
                className="ed-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Message Content *
              </label>
              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note to the class teacher or academic coordinator..."
                className="ed-textarea"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="ed-btn ed-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
            >
              <Send size={15} />
              {sending ? 'Dispatching...' : 'Send Dispatch'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ParentCommunicationPage;
