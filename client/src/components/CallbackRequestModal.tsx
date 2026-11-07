import React, { useState, useEffect } from 'react';
import { PhoneCall, CheckCircle, X, Clock, User, Mail, GraduationCap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { marketingApi } from '../services/api.js';
import { getStoredUtmParams, trackGa4Event } from '../utils/utmTracker.js';

interface CallbackRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
}

export const CallbackRequestModal: React.FC<CallbackRequestModalProps> = ({
  isOpen,
  onClose,
  schoolName = 'Apex Academy',
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [applyingClass, setApplyingClass] = useState('Grade 1');
  const [preferredTime, setPreferredTime] = useState('Morning (9:00 AM - 12:00 PM)');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('Please provide both your full name and a valid contact phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const utm = getStoredUtmParams();
      const res = await marketingApi.submitCallback({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        applyingClass,
        preferredTime,
        message: message.trim() || undefined,
        utmSource: utm.utmSource || undefined,
        utmMedium: utm.utmMedium || undefined,
        utmCampaign: utm.utmCampaign || undefined,
      });

      // apiRequest unwraps json.data, so res.requestNumber is present directly
      const requestNo = (res as any)?.requestNumber || (res as any)?.data?.requestNumber || 'CB-2026-0001';
      setSubmittedRequestNumber(requestNo);

      // Dispatch GA4 conversion event
      trackGa4Event('generate_lead', {
        event_category: 'Admissions',
        event_label: 'Callback Request',
        value: 1,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to schedule callback request. Please check your network and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedRequestNumber(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setMessage('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 25, 20, 0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="callback-modal-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleReset();
      }}
    >
      <div
        className="ed-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(196, 164, 107, 0.25)',
          border: '1px solid var(--border-default, #e2e8f0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner - Institutional Forest Green & Academic Gold */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0e2a22 0%, #163e32 60%, #1c4d3f 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--academic-gold-500, #c4a46b)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(196, 164, 107, 0.2)',
                border: '1px solid rgba(196, 164, 107, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PhoneCall size={20} style={{ color: 'var(--academic-gold-400, #fef08a)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--academic-gold-400, #dfc08a)',
                    fontWeight: 700,
                  }}
                >
                  Admissions Support Desk
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>•</span>
                <span style={{ fontSize: '0.68rem', color: '#a7f3d0' }}>Session 2026–2027</span>
              </div>
              <h3
                id="callback-modal-heading"
                style={{
                  fontFamily: 'var(--font-crest, Georgia, serif)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '2px 0 0',
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                Request an Admissions Callback
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            aria-label="Close modal"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {submittedRequestNumber ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(196, 164, 107, 0.2) 0%, rgba(22, 62, 50, 0.25) 100%)',
                  border: '2px solid var(--academic-gold-500, #c4a46b)',
                  color: 'var(--academic-gold-600, #997b3d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle size={36} style={{ color: 'var(--academic-gold-500, #c4a46b)' }} />
              </div>

              <div
                style={{
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--academic-gold-600, #997b3d)',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                Request Confirmed
              </div>

              <h4
                style={{
                  fontFamily: 'var(--font-crest, Georgia, serif)',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #0f172a)',
                  margin: '0 0 10px',
                }}
              >
                Admissions Callback Scheduled!
              </h4>

              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary, #475569)',
                  maxWidth: '420px',
                  margin: '0 auto 18px',
                  lineHeight: 1.6,
                }}
              >
                Thank you, <strong>{fullName}</strong>. An official admissions counsellor at{' '}
                <strong>{schoolName}</strong> will call you at{' '}
                <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>{phone}</span> during your
                preferred time window.
              </p>

              {/* Reference ID Card */}
              <div
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  gap: '4px',
                  backgroundColor: 'var(--bg-subtle, #f8fafc)',
                  border: '1px dashed var(--academic-gold-500, #c4a46b)',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                  OFFICIAL REFERENCE ID
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--primary-800, #0e2a22)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {submittedRequestNumber}
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted, #64748b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '22px',
                }}
              >
                <Clock size={14} style={{ color: 'var(--academic-gold-500)' }} />
                <span>Expected Response: Within 2 to 4 working hours</span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="ed-btn-academic-gold"
                  style={{ cursor: 'pointer', padding: '10px 28px' }}
                >
                  <span>Done & Return to Website</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {errorMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#b91c1c',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    lineHeight: 1.4,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Full Name */}
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} style={{ color: 'var(--academic-gold-500)' }} />
                  <span>Full Name of Parent / Student *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="ed-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Phone & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PhoneCall size={14} style={{ color: 'var(--academic-gold-500)' }} />
                    <span>Contact Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98100 23456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Email Address (Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ed-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Class & Preferred Time */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GraduationCap size={14} style={{ color: 'var(--academic-gold-500)' }} />
                    <span>Class Seeking Admission</span>
                  </label>
                  <select
                    value={applyingClass}
                    onChange={(e) => setApplyingClass(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Pre-Primary / Nursery">Pre-Primary / Nursery</option>
                    <option value="Kindergarten / Prep">Kindergarten / Prep</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11 - Science">Grade 11 - Science</option>
                    <option value="Grade 11 - Commerce">Grade 11 - Commerce</option>
                    <option value="Grade 11 - Humanities">Grade 11 - Humanities</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} style={{ color: 'var(--academic-gold-500)' }} />
                    <span>Preferred Call Window</span>
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="ed-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                    <option value="Afternoon (12:00 PM - 3:00 PM)">Afternoon (12:00 PM - 3:00 PM)</option>
                    <option value="Evening (3:00 PM - 6:00 PM)">Evening (3:00 PM - 6:00 PM)</option>
                    <option value="Anytime during school hours">Anytime during school hours</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Specific Query or Admission Interests (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ask about fee structures, transport coverage, lab facilities, or scholarships..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="ed-input"
                  style={{ width: '100%', resize: 'none', minHeight: '60px' }}
                />
              </div>

              {/* Privacy Notice */}
              <div
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-muted, #64748b)',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={14} style={{ color: 'var(--academic-gold-500)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Your information is strictly protected by institutional confidentiality policies. Our counsellors will only contact you regarding academic admissions.
                </span>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-default, #e2e8f0)',
                  marginTop: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={handleReset}
                  className="ed-btn ed-btn-outline"
                  style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ed-btn-academic-gold"
                  style={{
                    padding: '9px 24px',
                    fontSize: '0.88rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.75 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <PhoneCall size={15} />
                      <span>Request Instant Callback</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
