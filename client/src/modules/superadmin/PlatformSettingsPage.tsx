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
} from 'lucide-react';
import { superadminApi } from '../../services/api.js';

export const PlatformSettingsPage: React.FC = () => {
  const [initialSettings, setInitialSettings] = useState<any | null>(null);
  const [formData, setFormData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Maintenance Confirmation Modal
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

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

  useEffect(() => {
    loadSettings();
  }, []);

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
