import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  Calendar,
  Layers,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { operationsApi } from '../../services/api.js';

interface FeeStructureItem {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  feeHead: string;
  amount: number;
  frequency: string;
  invoicesCount: number;
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
}

export const AccountsFeeStructuresPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [structures, setStructures] = useState<FeeStructureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructureItem | null>(null);

  // Form Fields
  const [formClassName, setFormClassName] = useState('Grade 10');
  const [formFeeHead, setFormFeeHead] = useState('Tuition & Academic Training');
  const [formAmount, setFormAmount] = useState<number>(35000);
  const [formFrequency, setFormFrequency] = useState<'ANNUAL' | 'TERM' | 'MONTHLY'>('TERM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadStructures = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await operationsApi.listFeeStructures();
      if (Array.isArray(data)) {
        setStructures(data as FeeStructureItem[]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load fee structures from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructures();
  }, []);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formAmount <= 0) {
      showToast('Fee structure amount must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      await operationsApi.createFeeStructure({
        className: formClassName,
        feeHead: formFeeHead,
        amount: formAmount,
        frequency: formFrequency,
      });

      setIsCreateModalOpen(false);
      showToast(`Fee structure '${formFeeHead}' for ${formClassName} persisted in PostgreSQL.`);
      await loadStructures();
    } catch (err: any) {
      showToast('Failed to create fee structure: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStructure) return;

    if (formAmount <= 0) {
      showToast('Amount must be positive.');
      return;
    }

    try {
      setIsSubmitting(true);
      await operationsApi.updateFeeStructure(editingStructure.id, {
        feeHead: formFeeHead,
        amount: formAmount,
        frequency: formFrequency,
      });

      setEditingStructure(null);
      showToast(`Fee structure updated successfully.`);
      await loadStructures();
    } catch (err: any) {
      showToast('Failed to update fee structure: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStructure = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the fee structure '${name}'?`)) {
      return;
    }

    try {
      await operationsApi.deleteFeeStructure(id);
      showToast(`Fee structure deleted.`);
      await loadStructures();
    } catch (err: any) {
      showToast(err.message || 'Deletion failed.');
    }
  };

  const openEditModal = (item: FeeStructureItem) => {
    setEditingStructure(item);
    setFormClassName(item.className);
    setFormFeeHead(item.feeHead);
    setFormAmount(item.amount);
    setFormFrequency(item.frequency as any);
  };

  const filteredStructures = structures.filter((s) => {
    const matchesSearch =
      s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.feeHead.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFreq = frequencyFilter === 'ALL' || s.frequency === frequencyFilter;
    return matchesSearch && matchesFreq;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            fontSize: '0.86rem',
          }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--success-solid)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2>Approved Fee Structures</h2>
            <Badge variant="teal">{structures.length} Configured Slabs</Badge>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Official tuition and ancillary fee heads configured in PostgreSQL for {branding.schoolName}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadStructures}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => {
              setFormClassName('Grade 10');
              setFormFeeHead('Tuition & Academic Training');
              setFormAmount(35000);
              setFormFrequency('TERM');
              setIsCreateModalOpen(true);
            }}
          >
            Configure New Fee Structure
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="ed-card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search class or fee head..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ed-input"
              style={{ paddingLeft: '32px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Frequency:</span>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="ed-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Frequencies</option>
              <option value="TERM">Term / Quarterly</option>
              <option value="ANNUAL">Annual</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structure Cards Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <span>Loading fee structures from PostgreSQL...</span>
        </div>
      ) : filteredStructures.length === 0 ? (
        <div className="ed-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileSpreadsheet size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <h4 style={{ margin: '0 0 6px' }}>No Fee Structures Configured</h4>
          <p style={{ fontSize: '0.84rem', margin: '0 0 16px' }}>
            No fee structure records match the specified filters. Create a new slab to get started.
          </p>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setIsCreateModalOpen(true)}>
            Add First Fee Structure
          </Button>
        </div>
      ) : (
        <div className="ed-grid-3">
          {filteredStructures.map((s) => (
            <div key={s.id} className="ed-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <Badge variant="teal">{s.className}</Badge>
                  <Badge variant="neutral">{s.frequency}</Badge>
                </div>
                <h4 style={{ margin: '0 0 var(--space-2)' }}>{s.feeHead}</h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: 'var(--space-3)' }}>
                  ₹{s.amount.toLocaleString('en-IN')}{' '}
                  <span style={{ fontSize: '0.80rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                    / {s.frequency.toLowerCase()}
                  </span>
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.80rem', lineHeight: 1.6 }}>
                  <div><strong>Billed Invoices:</strong> {s.invoicesCount} student billings</div>
                  <div><strong>Total Billed:</strong> ₹{s.totalInvoiced.toLocaleString('en-IN')}</div>
                  <div><strong>Total Realized:</strong> ₹{s.totalCollected.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Edit2 size={13} />}
                  onClick={() => openEditModal(s)}
                >
                  Edit Slab
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Trash2 size={13} style={{ color: 'var(--danger-solid)' }} />}
                  onClick={() => handleDeleteStructure(s.id, s.feeHead)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Fee Structure */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Configure New Fee Structure"
        subtitle="Define an institutional fee slab persisted directly in PostgreSQL"
      >
        <form onSubmit={handleCreateStructure} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Target Academic Class</label>
            <input
              type="text"
              className="ed-input"
              value={formClassName}
              onChange={(e) => setFormClassName(e.target.value)}
              placeholder="e.g. Grade 10, Grade 9, Primary Wing"
              required
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Fee Head / Component</label>
            <input
              type="text"
              className="ed-input"
              value={formFeeHead}
              onChange={(e) => setFormFeeHead(e.target.value)}
              placeholder="e.g. Science & Robotics Laboratory Facility"
              required
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Amount (₹)</label>
            <input
              type="number"
              className="ed-input"
              value={formAmount}
              onChange={(e) => setFormAmount(Number(e.target.value))}
              min={100}
              required
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Billing Frequency</label>
            <select
              className="ed-select"
              value={formFrequency}
              onChange={(e) => setFormFrequency(e.target.value as any)}
            >
              <option value="TERM">Term / Quarterly</option>
              <option value="ANNUAL">Annual</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Persisting to DB...' : 'Save Fee Structure'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Fee Structure */}
      {editingStructure && (
        <Modal
          isOpen={!!editingStructure}
          onClose={() => setEditingStructure(null)}
          title="Update Fee Structure"
          subtitle={`Class: ${editingStructure.className}`}
        >
          <form onSubmit={handleUpdateStructure} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Fee Head / Component</label>
              <input
                type="text"
                className="ed-input"
                value={formFeeHead}
                onChange={(e) => setFormFeeHead(e.target.value)}
                required
              />
            </div>

            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Amount (₹)</label>
              <input
                type="number"
                className="ed-input"
                value={formAmount}
                onChange={(e) => setFormAmount(Number(e.target.value))}
                min={100}
                required
              />
            </div>

            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Billing Frequency</label>
              <select
                className="ed-select"
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value as any)}
              >
                <option value="TERM">Term / Quarterly</option>
                <option value="ANNUAL">Annual</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Button variant="secondary" type="button" onClick={() => setEditingStructure(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating DB...' : 'Update Fee Structure'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
