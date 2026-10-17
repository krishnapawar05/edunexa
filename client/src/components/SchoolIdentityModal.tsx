import React, { useState } from 'react';
import { X, Building2, Palette, Check, RotateCcw, Sparkles } from 'lucide-react';
import { useSchoolBranding, DEFAULT_BRANDING } from '../context/SchoolBrandingContext.js';

export const SchoolIdentityModal: React.FC = () => {
  const { branding, updateBranding, resetBranding, isCustomizing, setIsCustomizing } = useSchoolBranding();

  const [form, setForm] = useState({ ...branding });

  if (!isCustomizing) return null;

  const presetThemes = [
    { name: 'Institutional Teal', color: '#0F766E' },
    { name: 'Scholar Navy', color: '#1E3A8A' },
    { name: 'Forest Emerald', color: '#065F46' },
    { name: 'Royal Crimson', color: '#881337' },
    { name: 'Slate Gray', color: '#334155' },
  ];

  const presetSchools = [
    {
      schoolName: 'Apex Academy of Sciences & Arts',
      shortName: 'Apex Academy',
      code: 'APX-01',
      tagline: 'Fostering Academic Excellence, Scientific Rigor & Global Leadership',
      monogram: 'A',
      primaryAccent: '#0F766E',
    },
    {
      schoolName: 'St. Jude International Academy',
      shortName: 'St. Jude Academy',
      code: 'SJA-09',
      tagline: 'Truth, Honor, Knowledge & Character',
      monogram: 'J',
      primaryAccent: '#1E3A8A',
    },
    {
      schoolName: 'Greenwood World School & Research Centre',
      shortName: 'Greenwood World',
      code: 'GWS-22',
      tagline: 'Cultivating Inquisitive Minds & Sustainable Futures',
      monogram: 'G',
      primaryAccent: '#065F46',
    },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding(form);
    setIsCustomizing(false);
  };

  const handleApplyPreset = (preset: typeof presetSchools[0]) => {
    setForm((prev) => ({
      ...prev,
      schoolName: preset.schoolName,
      shortName: preset.shortName,
      code: preset.code,
      tagline: preset.tagline,
      monogram: preset.monogram,
      primaryAccent: preset.primaryAccent,
    }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-4)',
      }}
      onClick={() => setIsCustomizing(false)}
    >
      <div
        className="ed-modal-container"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #cbd5e1',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Building2 size={18} style={{ color: 'var(--primary-700)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Configure School Identity & Branding</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Stage 1 PRD Requirement: School name & branding must be configurable without hardcoded finalization
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCustomizing(false)}
            className="ed-btn-icon"
            aria-label="Close configuration modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', backgroundColor: '#ffffff' }}>
          {/* Quick Presets */}
          <div>
            <label className="ed-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Sparkles size={13} style={{ color: 'var(--primary-700)' }} /> Instant Demonstration Presets
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {presetSchools.map((p) => (
                <button
                  type="button"
                  key={p.code}
                  onClick={() => handleApplyPreset(p)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    backgroundColor: form.code === p.code ? '#eff6ff' : '#ffffff',
                    color: form.code === p.code ? 'var(--primary-700)' : 'var(--text-secondary)',
                    fontWeight: form.code === p.code ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {p.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* School Name */}
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Official School Name</label>
            <input
              type="text"
              className="ed-input"
              value={form.schoolName}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
              required
            />
          </div>

          {/* Short Name & Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Short Name / Display Title</label>
              <input
                type="text"
                className="ed-input"
                value={form.shortName}
                onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                required
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">School Code / Monogram</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="ed-input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
                <input
                  type="text"
                  maxLength={1}
                  className="ed-input"
                  style={{ width: '45px', textAlign: 'center', fontWeight: 700 }}
                  value={form.monogram}
                  onChange={(e) => setForm({ ...form, monogram: e.target.value.toUpperCase() })}
                  title="Single-letter crest monogram"
                />
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Institutional Motto / Tagline</label>
            <input
              type="text"
              className="ed-input"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>

          {/* Affiliation */}
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Accreditation / Affiliation</label>
            <input
              type="text"
              className="ed-input"
              value={form.affiliation}
              onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
            />
          </div>

          {/* Contact Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Admissions Email</label>
              <input
                type="email"
                className="ed-input"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Contact Phone</label>
              <input
                type="text"
                className="ed-input"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </div>
          </div>

          {/* Primary Color Accent Theme */}
          <div>
            <label className="ed-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Palette size={13} /> Institutional Accent Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {presetThemes.map((theme) => (
                <button
                  type="button"
                  key={theme.color}
                  onClick={() => setForm({ ...form, primaryAccent: theme.color })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: form.primaryAccent === theme.color ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-subtle)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: theme.color,
                      display: 'inline-block',
                    }}
                  />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'var(--space-4)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                resetBranding();
                setForm(DEFAULT_BRANDING);
              }}
              className="ed-btn ed-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <RotateCcw size={14} /> Reset Defaults
            </button>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setIsCustomizing(false)}
                className="ed-btn ed-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ed-btn ed-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Check size={14} /> Apply Identity
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
