import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Send, Sparkles, Phone, Mail, HelpCircle } from 'lucide-react';
import { admissionsApi } from '../services/api.js';

interface AdmissionEnquiryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  schoolSlug?: string;
}

export const AdmissionEnquiryModal: React.FC<AdmissionEnquiryModalProps> = ({
  isOpen: manualIsOpen,
  onClose: manualOnClose,
  schoolSlug,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    parentName: '',
    studentName: '',
    phone: '',
    email: '',
    applyingClass: 'Grade 9',
    message: '',
  });

  // Load public config and handle auto-popup frequency
  useEffect(() => {
    let isMounted = true;
    const loadConfigAndCheckPopup = async () => {
      try {
        setLoading(true);
        const res = await admissionsApi.getPublicConfig(schoolSlug);
        if (!isMounted) return;
        const cfg = (res as any).data || res;
        setConfig(cfg);

        if (cfg.classes && cfg.classes.length > 0) {
          setFormData((prev) => ({ ...prev, applyingClass: cfg.classes[0].name }));
        }

        // If manualIsOpen is not provided, evaluate automatic popup
        if (manualIsOpen === undefined && cfg.popup?.enabled) {
          const freq = cfg.popup.frequency || 'ONCE_PER_SESSION';
          const today = new Date().toISOString().split('T')[0];

          if (freq === 'ONCE_PER_SESSION') {
            const dismissed = sessionStorage.getItem('edunexa_enquiry_popup_dismissed');
            if (!dismissed) {
              const timer = setTimeout(() => {
                if (isMounted) setIsOpen(true);
              }, 3500);
              return () => clearTimeout(timer);
            }
          } else if (freq === 'ONCE_PER_DAY') {
            const lastDismissedDay = localStorage.getItem('edunexa_enquiry_popup_day');
            if (lastDismissedDay !== today) {
              const timer = setTimeout(() => {
                if (isMounted) setIsOpen(true);
              }, 3500);
              return () => clearTimeout(timer);
            }
          } else if (freq === 'EVERY_VISIT') {
            const timer = setTimeout(() => {
              if (isMounted) setIsOpen(true);
            }, 3000);
            return () => clearTimeout(timer);
          }
        }
      } catch (err) {
        console.warn('Could not load admission enquiry config', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadConfigAndCheckPopup();
    return () => {
      isMounted = false;
    };
  }, [schoolSlug]);

  // Sync manual open prop if passed
  useEffect(() => {
    if (manualIsOpen !== undefined) {
      setIsOpen(manualIsOpen);
      if (manualIsOpen) {
        setSubmitted(false);
        setError(null);
      }
    }
  }, [manualIsOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (manualOnClose) manualOnClose();

    // Mark dismissed in storage
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.setItem('edunexa_enquiry_popup_dismissed', 'true');
    localStorage.setItem('edunexa_enquiry_popup_day', today);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.parentName.trim()) {
      setError('Parent / Guardian name is required.');
      return;
    }
    if (!formData.studentName.trim()) {
      setError('Applicant student name is required.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      setError('Please provide a valid 10-digit telephone number.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await admissionsApi.submitEnquiry(
        {
          parentName: formData.parentName.trim(),
          studentName: formData.studentName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim().toLowerCase(),
          applyingClass: formData.applyingClass,
          message: formData.message.trim() || undefined,
        },
        schoolSlug
      );

      const refNo = (res as any).data?.enquiryNumber || (res as any).enquiryNumber || 'ENQ-2026-REC';
      setReferenceNo(refNo);
      setSubmitted(true);

      const today = new Date().toISOString().split('T')[0];
      sessionStorage.setItem('edunexa_enquiry_popup_dismissed', 'true');
      localStorage.setItem('edunexa_enquiry_popup_day', today);
    } catch (err: any) {
      setError(err.message || 'Failed to submit admission enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-heading"
    >
      <div
        className="ed-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} color="#93c5fd" />
            </div>
            <div>
              <h3 id="enquiry-modal-heading" style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: '#ffffff' }}>
                {config?.popup?.heading || 'Admissions Enquiry 2026–2027'}
              </h3>
              <p style={{ fontSize: '0.74rem', margin: 0, opacity: 0.85, color: '#e0e7ff' }}>
                Official Admissions Desk • Apex Academy of Excellence
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle size={36} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Enquiry Successfully Registered!
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                Thank you for your interest in our institution. Your enquiry reference number is:
              </p>
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px dashed #3b82f6',
                  display: 'inline-block',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  letterSpacing: '0.05em',
                  color: '#1e40af',
                  marginBottom: '18px',
                }}
              >
                {referenceNo}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Our admissions counseling officer will review your enquiry and contact you within 1 business day via email or phone.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a
                  href="/admissions"
                  className="ed-btn ed-btn-primary"
                  style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  Go to Admission Portal
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="ed-btn ed-btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.45 }}>
                {config?.popup?.description ||
                  'Submit your details below to receive the official prospectus, schedule a campus tour, or speak with our academic admissions committee.'}
              </p>

              {error && (
                <div
                  style={{
                    padding: '8px 12px',
                    marginBottom: '14px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #f87171',
                    borderRadius: '6px',
                    color: '#991b1b',
                    fontSize: '0.8rem',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="ed-input-group">
                  <label className="ed-label" style={{ fontSize: '0.78rem' }}>Parent / Guardian Name *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    placeholder="e.g. Robert Vance"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>
                <div className="ed-input-group">
                  <label className="ed-label" style={{ fontSize: '0.78rem' }}>Applicant Student Name *</label>
                  <input
                    required
                    type="text"
                    className="ed-input"
                    placeholder="e.g. Leo Vance"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="ed-input-group">
                  <label className="ed-label" style={{ fontSize: '0.78rem' }}>Contact Telephone *</label>
                  <input
                    required
                    type="tel"
                    className="ed-input"
                    placeholder="+91 98450 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="ed-input-group">
                  <label className="ed-label" style={{ fontSize: '0.78rem' }}>Parent Email Address *</label>
                  <input
                    required
                    type="email"
                    className="ed-input"
                    placeholder="parent@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="ed-input-group" style={{ marginBottom: '12px' }}>
                <label className="ed-label" style={{ fontSize: '0.78rem' }}>Applying Class / Grade *</label>
                <select
                  className="ed-input"
                  value={formData.applyingClass}
                  onChange={(e) => setFormData({ ...formData, applyingClass: e.target.value })}
                >
                  {config?.classes && config.classes.length > 0 ? (
                    config.classes.map((cls: any) => (
                      <option key={cls.id || cls.code} value={cls.name}>
                        {cls.name} {cls.stage ? `(${cls.stage})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11 - Science">Grade 11 - Science</option>
                      <option value="Grade 11 - Commerce">Grade 11 - Commerce</option>
                    </>
                  )}
                </select>
              </div>

              <div className="ed-input-group" style={{ marginBottom: '18px' }}>
                <label className="ed-label" style={{ fontSize: '0.78rem' }}>Message / Specific Academic Query (Optional)</label>
                <textarea
                  className="ed-input"
                  rows={2}
                  placeholder="Enquiring regarding curriculum, transport facility, or scholarship criteria..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="ed-btn ed-btn-secondary"
                  disabled={submitting}
                  style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="ed-btn ed-btn-primary"
                  disabled={submitting}
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Enquiry'}
                  <Send size={14} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
