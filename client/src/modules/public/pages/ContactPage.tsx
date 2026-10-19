import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const ContactPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>REACH OUT</span>
        <h1>Contact & Campus Location</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          We welcome inquiries from prospective families, partner institutions, and educational researchers.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-8)' }}>
        {/* Left Column: Direct Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Campus Headquarters</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={18} style={{ color: 'var(--primary-600)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Physical Address:</strong><br />
                  {branding.address}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Phone size={18} style={{ color: 'var(--primary-600)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Direct Inquiries:</strong><br />
                  Main Switchboard: {branding.contactPhone}<br />
                  Admissions Bureau: +91 (80) 4123-9002<br />
                  Accounts Desk: +91 (80) 4123-9008
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Mail size={18} style={{ color: 'var(--primary-600)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Official Inquiries:</strong><br />
                  General: info@apexacademy.edu<br />
                  Admissions: admissions@apexacademy.edu<br />
                  Principal's Office: principal@apexacademy.edu
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Clock size={18} style={{ color: 'var(--primary-600)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Office Hours:</strong><br />
                  Monday – Friday: 08:00 AM – 04:30 PM<br />
                  Saturday: 08:30 AM – 01:00 PM (Admissions Only)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Inquiry Form */}
        <div className="ed-card ed-card-body" style={{ backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Send an Institutional Inquiry</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            Your dispatch will be routed to the appropriate academic or administrative bureau.
          </p>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
              <CheckCircle2 size={50} style={{ color: 'var(--success-solid)', margin: '0 auto var(--space-3)' }} />
              <h3>Inquiry Dispatched Successfully!</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Thank you for contacting {branding.schoolName}. An institutional officer will review your inquiry and respond within 24 hours.
              </p>
              <button
                className="ed-btn ed-btn-secondary"
                style={{ marginTop: 'var(--space-4)' }}
                onClick={() => setSubmitted(false)}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label">Your Full Name *</label>
                  <input
                    required
                    className="ed-input"
                    placeholder="e.g. Ramesh Chandra"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label">Email Address *</label>
                  <input
                    required
                    type="email"
                    className="ed-input"
                    placeholder="name@domain.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label">Contact Phone</label>
                  <input
                    type="tel"
                    className="ed-input"
                    placeholder="+91 98000 00000"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label">Inquiry Department</label>
                  <select
                    className="ed-select"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  >
                    <option>General Admissions Desk</option>
                    <option>Academic Curriculum Question</option>
                    <option>Accounts & Fee Payment Desk</option>
                    <option>Transport & Boarding Logistics</option>
                  </select>
                </div>
              </div>

              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Inquiry Message *</label>
                <textarea
                  required
                  rows={4}
                  className="ed-input"
                  placeholder="State your question or consultation request in detail..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 'var(--space-2)' }}>
                <button
                  type="submit"
                  className="ed-btn ed-btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.92rem', fontWeight: 600 }}
                >
                  <Send size={15} /> Dispatch Message to Administration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
