import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Server,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Radio,
  X,
  Building2,
  Palette,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';
import { superadminApi } from '../../services/api.js';
import { useSchoolBranding, DEFAULT_BRANDING, SchoolBranding } from '../../context/SchoolBrandingContext.js';
import { SchoolIdentityModal } from '../../components/SchoolIdentityModal.js';

export const PlatformSettingsPage: React.FC = () => {
  const { branding, updateBranding, setIsCustomizing } = useSchoolBranding();
  const [initialSettings, setInitialSettings] = useState<any | null>(null);
  const [formData, setFormData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Tenant Branding State
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [brandingForm, setBrandingForm] = useState<SchoolBranding>(branding);
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  // Maintenance Confirmation Modal
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const presetThemes = [
    { name: 'Forest Green (Official)', color: '#244C3A' },
    { name: 'Secondary Green', color: '#365C49' },
    { name: 'Muted Gold Accent', color: '#C4A46B' },
    { name: 'Sage Academic', color: '#4A745F' },
    { name: 'Royal Crimson', color: '#881337' },
  ];

  const presetSchools = [
    {
      schoolName: 'Apex Academy of Sciences & Arts',
      shortName: 'Apex Academy',
      code: 'APX-01',
      tagline: 'Fostering Academic Excellence, Scientific Rigor & Global Leadership',
      monogram: 'A',
      primaryAccent: '#244C3A',
      affiliation: 'CBSE & Cambridge Assessment International Education',
      establishedYear: 1998,
      contactEmail: 'admissions@apexacademy.edu',
      contactPhone: '+91 (11) 2840-9100',
      address: 'Sector 14, Institutional Area, New Delhi, India 110025',
    },
    {
      schoolName: 'St. Joseph Public School',
      shortName: 'St. Joseph School',
      code: 'SJP-01',
      tagline: 'Character, Discipline, Academic Distinction & Service',
      monogram: 'J',
      primaryAccent: '#244C3A',
      affiliation: 'ICSE & ISC Affiliated Institution',
      establishedYear: 1985,
      contactEmail: 'office@stjosephspublicschool.org',
      contactPhone: '+91 (80) 2558-8421',
      address: 'PB No. 25003, Museum Road, Bengaluru, Karnataka 560025',
    },
    {
      schoolName: 'Greenwood World School & Research Centre',
      shortName: 'Greenwood World',
      code: 'GWS-22',
      tagline: 'Cultivating Inquisitive Minds & Sustainable Futures',
      monogram: 'G',
      primaryAccent: '#365C49',
      affiliation: 'IB World School & CBSE International',
      establishedYear: 2004,
      contactEmail: 'admissions@greenwoodworld.edu',
      contactPhone: '+91 (44) 4390-1200',
      address: 'Campus Ridge, OMR Expressway, Chennai, Tamil Nadu 600119',
    },
  ];

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superadminApi.getSettings();
      setInitialSettings(data);
      setFormData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform settings.');
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async () => {
    try {
      const data = await superadminApi.listSchools();
      setSchools(data || []);
      if (data && data.length > 0) {
        const match = data.find((s: any) => s.code === branding.code) || data[0];
        setSelectedSchoolId(match.id);
        initBrandingFromSchool(match);
      }
    } catch (err) {
      console.warn('Failed to load schools for branding:', err);
    }
  };

  const initBrandingFromSchool = (school: any) => {
    const cfg = school.brandingConfig || {};
    setBrandingForm({
      schoolName: school.name || branding.schoolName,
      shortName: cfg.shortName || school.name || branding.shortName,
      code: school.code || branding.code,
      tagline: school.motto || cfg.tagline || branding.tagline,
      affiliation: cfg.affiliation || branding.affiliation,
      establishedYear: school.establishedYear || cfg.establishedYear || branding.establishedYear,
      contactEmail: school.email || branding.contactEmail,
      contactPhone: school.phone || branding.contactPhone,
      address: school.address || branding.address,
      primaryAccent: cfg.primaryAccent || branding.primaryAccent,
      monogram: cfg.monogram || branding.monogram,
    });
  };

  useEffect(() => {
    loadSettings();
    loadSchools();
  }, []);

  const handleSelectSchool = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    const school = schools.find((s: any) => s.id === schoolId);
    if (school) {
      initBrandingFromSchool(school);
    }
  };

  const handleApplyPreset = (preset: typeof presetSchools[0]) => {
    setBrandingForm((prev) => ({
      ...prev,
      schoolName: preset.schoolName,
      shortName: preset.shortName,
      code: preset.code,
      tagline: preset.tagline,
      monogram: preset.monogram,
      primaryAccent: preset.primaryAccent,
      affiliation: preset.affiliation,
      establishedYear: preset.establishedYear,
      contactEmail: preset.contactEmail,
      contactPhone: preset.contactPhone,
      address: preset.address,
    }));
  };

  const handleSaveBranding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingBranding(true);
    setBrandingError(null);
    setBrandingSuccess(null);

    try {
      if (selectedSchoolId) {
        await superadminApi.updateSchool(selectedSchoolId, {
          name: brandingForm.schoolName,
          email: brandingForm.contactEmail,
          phone: brandingForm.contactPhone,
          address: brandingForm.address,
          motto: brandingForm.tagline,
          code: brandingForm.code,
          brandingConfig: {
            shortName: brandingForm.shortName,
            monogram: brandingForm.monogram,
            affiliation: brandingForm.affiliation,
            primaryAccent: brandingForm.primaryAccent,
            establishedYear: brandingForm.establishedYear,
            tagline: brandingForm.tagline,
          },
        });
      }
      updateBranding(brandingForm);
      setBrandingSuccess(`Tenant branding for "${brandingForm.shortName}" successfully saved and persisted to database.`);
      setTimeout(() => setBrandingSuccess(null), 5000);
    } catch (err: any) {
      setBrandingError(err.message || 'Failed to persist tenant branding to database.');
    } finally {
      setSavingBranding(false);
    }
  };

  const isDirty = initialSettings && formData && JSON.stringify(initialSettings) !== JSON.stringify(formData);

  const handleReset = () => {
    setFormData(initialSettings);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessBanner(null);

    try {
      const updated = await superadminApi.updateSettings(formData);
      setInitialSettings(updated);
      setFormData(updated);
      setSuccessBanner('Platform configuration saved successfully and audit event recorded.');
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save platform configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="ed-card ed-card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading platform configuration settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Platform Settings & Governance
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            System-wide identity, security policies, maintenance toggles, and infrastructure health
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {isDirty && (
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--warning-solid)',
                backgroundColor: 'var(--warning-bg)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
              }}
            >
              ● Unsaved Changes
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="ed-btn ed-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success-text)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--success-solid)' }} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger-text)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic School Identity Modal (Authorized for Super Admin Only) */}
      <SchoolIdentityModal />

      {/* School Identity & Branding Configuration Section */}
      <div className="ed-card" id="school-branding-section" style={{ border: '1px solid var(--border-default)' }}>
        <div
          className="ed-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            backgroundColor: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-default)',
            padding: 'var(--space-4) var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Building2 size={18} style={{ color: 'var(--primary-700)' }} />
            <div>
              <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>School Identity & Branding Configuration</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Centralized multi-tenant institutional branding, crest monograms, official contact info, and theme palette
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={() => setIsCustomizing(true)}
              className="ed-btn ed-btn-secondary"
              title="Open full interactive School Identity Modal (Reused Component)"
              style={{
                padding: '5px 12px',
                fontSize: '0.80rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sliders size={13} style={{ color: 'var(--primary-700)' }} />
              <span>Branding: <strong>{brandingForm.shortName}</strong> (Modal Quick-Edit)</span>
            </button>
          </div>
        </div>

        <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
          {/* Tenant Selector Dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ minWidth: '240px' }}>
              <label className="ed-label" style={{ fontWeight: 600, marginBottom: '4px' }}>
                Active School Tenant
              </label>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Select a tenant to view, edit, and persist institution-specific branding.
              </div>
            </div>
            <div style={{ minWidth: '280px', flex: 1, maxWidth: '450px' }}>
              <select
                className="ed-select"
                value={selectedSchoolId}
                onChange={(e) => handleSelectSchool(e.target.value)}
                style={{ width: '100%', fontWeight: 600 }}
              >
                {schools.length === 0 ? (
                  <option value="">No school tenants found</option>
                ) : (
                  schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'NO-CODE'}) — {s.city || 'Campus'}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Demonstration Quick Presets */}
          <div>
            <label className="ed-label" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
              <Sparkles size={13} style={{ color: 'var(--primary-700)' }} /> Instant Demonstration Presets
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {presetSchools.map((p) => (
                <button
                  type="button"
                  key={p.code}
                  onClick={() => handleApplyPreset(p)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: brandingForm.code === p.code ? 'var(--primary-50)' : 'var(--bg-surface)',
                    color: brandingForm.code === p.code ? 'var(--primary-700)' : 'var(--text-secondary)',
                    fontWeight: brandingForm.code === p.code ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {p.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Branding Success / Error Banners */}
          {brandingSuccess && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--success-text)',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} style={{ color: 'var(--success-solid)' }} />
              <span>{brandingSuccess}</span>
            </div>
          )}

          {brandingError && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger-text)',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{brandingError}</span>
            </div>
          )}

          {/* School Name */}
          <div className="ed-input-group">
            <label className="ed-label">Official School Name</label>
            <input
              type="text"
              className="ed-input"
              value={brandingForm.schoolName}
              onChange={(e) => setBrandingForm({ ...brandingForm, schoolName: e.target.value })}
              placeholder="e.g. Apex Academy of Sciences & Arts"
              required
            />
          </div>

          {/* Short Name & School Code & Monogram */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group">
              <label className="ed-label">Short Name / Display Title</label>
              <input
                type="text"
                className="ed-input"
                value={brandingForm.shortName}
                onChange={(e) => setBrandingForm({ ...brandingForm, shortName: e.target.value })}
                placeholder="e.g. Apex Academy"
                required
              />
            </div>

            <div className="ed-input-group">
              <label className="ed-label">School Code</label>
              <input
                type="text"
                className="ed-input"
                value={brandingForm.code}
                onChange={(e) => setBrandingForm({ ...brandingForm, code: e.target.value })}
                placeholder="e.g. APX-01"
                required
              />
            </div>

            <div className="ed-input-group">
              <label className="ed-label">Monogram Initial</label>
              <input
                type="text"
                maxLength={2}
                className="ed-input"
                style={{ textAlign: 'center', fontWeight: 700 }}
                value={brandingForm.monogram}
                onChange={(e) => setBrandingForm({ ...brandingForm, monogram: e.target.value.toUpperCase() })}
                title="Monogram crest letter (e.g. A, SJ)"
              />
            </div>
          </div>

          {/* Tagline / Motto */}
          <div className="ed-input-group">
            <label className="ed-label">Institutional Motto / Tagline</label>
            <input
              type="text"
              className="ed-input"
              value={brandingForm.tagline}
              onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
              placeholder="e.g. Fostering Academic Excellence, Scientific Rigor & Global Leadership"
            />
          </div>

          {/* Affiliation & Established Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group">
              <label className="ed-label">Accreditation / Affiliation</label>
              <input
                type="text"
                className="ed-input"
                value={brandingForm.affiliation}
                onChange={(e) => setBrandingForm({ ...brandingForm, affiliation: e.target.value })}
                placeholder="e.g. CBSE & Cambridge Assessment International Education"
              />
            </div>

            <div className="ed-input-group">
              <label className="ed-label">Established Year</label>
              <input
                type="number"
                min="1800"
                max="2030"
                className="ed-input"
                value={brandingForm.establishedYear || 1998}
                onChange={(e) => setBrandingForm({ ...brandingForm, establishedYear: parseInt(e.target.value, 10) || 1998 })}
              />
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group">
              <label className="ed-label">Admissions / Official Email</label>
              <input
                type="email"
                className="ed-input"
                value={brandingForm.contactEmail}
                onChange={(e) => setBrandingForm({ ...brandingForm, contactEmail: e.target.value })}
                placeholder="admissions@apexacademy.edu"
              />
            </div>

            <div className="ed-input-group">
              <label className="ed-label">Contact Telephone</label>
              <input
                type="text"
                className="ed-input"
                value={brandingForm.contactPhone}
                onChange={(e) => setBrandingForm({ ...brandingForm, contactPhone: e.target.value })}
                placeholder="+91 (11) 2840-9100"
              />
            </div>
          </div>

          {/* Campus Address */}
          <div className="ed-input-group">
            <label className="ed-label">Campus Physical Address</label>
            <input
              type="text"
              className="ed-input"
              value={brandingForm.address}
              onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
              placeholder="Sector 14, Institutional Area, New Delhi, India 110025"
            />
          </div>

          {/* Primary Color Accent Theme */}
          <div>
            <label className="ed-label" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
              <Palette size={14} style={{ color: 'var(--primary-700)' }} /> Institutional Primary Accent Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {presetThemes.map((theme) => (
                <button
                  type="button"
                  key={theme.color}
                  onClick={() => setBrandingForm({ ...brandingForm, primaryAccent: theme.color })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: brandingForm.primaryAccent === theme.color ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Custom Hex:</span>
                <input
                  type="text"
                  className="ed-input"
                  style={{ width: '90px', padding: '3px 8px', fontSize: '0.78rem', fontFamily: 'monospace' }}
                  value={brandingForm.primaryAccent}
                  onChange={(e) => setBrandingForm({ ...brandingForm, primaryAccent: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Live School Crest & Header Preview */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: brandingForm.primaryAccent,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                {brandingForm.monogram || 'E'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {brandingForm.schoolName || 'School Name'}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Code: <strong>{brandingForm.code}</strong> • {brandingForm.tagline || 'Excellence in Education'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveBranding()}
              disabled={savingBranding}
              className="ed-btn ed-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '0.84rem' }}
            >
              <Check size={14} />
              <span>{savingBranding ? 'Persisting to DB...' : 'Save School Branding'}</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Section 1: Platform Identity */}
        <div className="ed-card">
          <div className="ed-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Globe size={16} style={{ color: 'var(--primary-600)' }} />
            <span>Platform Identity & Institutional Contacts</span>
          </div>
          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="ed-input-group">
              <label className="ed-label">Platform Name</label>
              <input
                type="text"
                className="ed-input"
                value={formData?.platformName || ''}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="ed-input-group">
                <label className="ed-label">Global Support Email</label>
                <input
                  type="email"
                  className="ed-input"
                  value={formData?.supportEmail || ''}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                />
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Support Telephone</label>
                <input
                  type="tel"
                  className="ed-input"
                  value={formData?.supportPhone || ''}
                  onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="ed-input-group">
              <label className="ed-label">Default System Timezone</label>
              <select
                className="ed-select"
                value={formData?.defaultTimezone || 'Asia/Kolkata'}
                onChange={(e) => setFormData({ ...formData, defaultTimezone: e.target.value })}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">America/New_York (EST -05:00)</option>
                <option value="Europe/London">Europe/London (GMT +00:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Security & Session Governance */}
        <div className="ed-card">
          <div className="ed-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Shield size={16} style={{ color: 'var(--primary-600)' }} />
            <span>Security & Session Policies</span>
          </div>
          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="ed-input-group">
                <label className="ed-label">Session Idle Timeout (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="720"
                  className="ed-input"
                  value={formData?.sessionTimeoutMinutes || 120}
                  onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: parseInt(e.target.value, 10) || 120 })}
                />
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Max Failed Logins (Lockout Threshold)</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  className="ed-input"
                  value={formData?.maxFailedLogins || 5}
                  onChange={(e) => setFormData({ ...formData, maxFailedLogins: parseInt(e.target.value, 10) || 5 })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="enforceStrongPassword"
                checked={formData?.enforceStrongPassword || false}
                onChange={(e) => setFormData({ ...formData, enforceStrongPassword: e.target.checked })}
              />
              <label htmlFor="enforceStrongPassword" style={{ fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Enforce strong password policy (minimum 8 characters with upper, lower, and symbols)
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Operational Status & Broadcasts */}
        <div className="ed-card">
          <div className="ed-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Bell size={16} style={{ color: 'var(--primary-600)' }} />
            <span>Operational Broadcasts & Maintenance Mode</span>
          </div>
          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: formData?.maintenanceMode ? 'var(--warning-bg)' : 'var(--bg-subtle)',
                border: `1px solid ${formData?.maintenanceMode ? 'var(--warning-border)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  Platform Maintenance Mode
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  When active, non-admin users receive a maintenance banner on login.
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!formData?.maintenanceMode) {
                    setShowMaintenanceModal(true);
                  } else {
                    setFormData({ ...formData, maintenanceMode: false });
                  }
                }}
                className={`ed-btn ${formData?.maintenanceMode ? 'ed-btn-danger' : 'ed-btn-secondary'}`}
                style={{ fontSize: '0.80rem', padding: '6px 14px' }}
              >
                {formData?.maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
              </button>
            </div>

            <div className="ed-input-group">
              <label className="ed-label">System Broadcast Banner (Optional)</label>
              <input
                type="text"
                className="ed-input"
                placeholder="e.g. Scheduled database backup tonight at 02:00 AM IST"
                value={formData?.broadcastBanner || ''}
                onChange={(e) => setFormData({ ...formData, broadcastBanner: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Infrastructure & Engine Status (Read-Only) */}
        <div className="ed-card">
          <div className="ed-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Server size={16} style={{ color: 'var(--primary-600)' }} />
            <span>Infrastructure Engine Status</span>
          </div>
          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Connection URL</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                postgresql://postgres:••••••••@localhost:5432/edunexa_dev
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>JWT Access Token Engine</span>
              <span style={{ fontWeight: 600, color: 'var(--success-solid)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> HS256 Standard (Rotated Signing Key Active)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>AI Provider Integration</span>
              <span style={{ fontWeight: 600, color: 'var(--success-solid)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Google Gemini (Model: gemini-3.8-flash, Key: AQ.Ab••••••••)
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* Maintenance Mode Confirmation Modal */}
      {showMaintenanceModal && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ maxWidth: '440px' }}>
            <div className="ed-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--danger-text)' }}>
                <AlertTriangle size={18} />
                <span>Confirm Platform Maintenance Mode</span>
              </div>
              <button onClick={() => setShowMaintenanceModal(false)} className="ed-btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="ed-modal-body" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Enabling Maintenance Mode will display a system advisory banner across all school websites and ERP portal pages. Super Admin access remains unrestricted.
            </div>

            <div className="ed-modal-footer">
              <button onClick={() => setShowMaintenanceModal(false)} className="ed-btn ed-btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  setFormData({ ...formData, maintenanceMode: true });
                  setShowMaintenanceModal(false);
                }}
                className="ed-btn ed-btn-danger"
              >
                Confirm & Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
