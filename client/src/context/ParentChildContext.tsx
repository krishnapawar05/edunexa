import React, { createContext, useContext, useState, useEffect } from 'react';
import { portalsApi } from '../services/api.js';
import { Users, GraduationCap, CheckCircle2, CreditCard, ChevronRight } from 'lucide-react';

export interface Ward {
  id: string;
  studentProfileId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  name: string;
  email: string;
  phone?: string;
  gender: string;
  bloodGroup?: string;
  photoUrl?: string;
  className: string;
  sectionName: string;
  grade: string;
  rollNumber: number;
  academicSession: string;
  relationship: string;
  isPrimaryContact: boolean;
  attendancePercent: number;
  pendingFees: number;
  hasActiveAdmitCard: boolean;
}

interface ParentChildContextType {
  children: Ward[];
  selectedChild: Ward | null;
  selectedChildIndex: number;
  setSelectedChildIndex: (index: number) => void;
  selectChildById: (id: string) => void;
  loading: boolean;
  error: string | null;
  refreshChildren: () => Promise<void>;
}

const ParentChildContext = createContext<ParentChildContextType | undefined>(undefined);

export const ParentChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedChildIndex, setSelectedChildIndexState] = useState<number>(() => {
    const saved = localStorage.getItem('edunexa_parent_selected_child_idx');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await portalsApi.getParentChildren();
      setWards(list || []);

      // Bound check saved index
      if (list && list.length > 0) {
        if (selectedChildIndex >= list.length) {
          setSelectedChildIndexState(0);
          localStorage.setItem('edunexa_parent_selected_child_idx', '0');
        }
      }
    } catch (err: any) {
      console.error('Failed to load linked children:', err);
      setError(err.message || 'Unable to load child profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const setSelectedChildIndex = (index: number) => {
    if (index >= 0 && index < wards.length) {
      setSelectedChildIndexState(index);
      localStorage.setItem('edunexa_parent_selected_child_idx', index.toString());
    }
  };

  const selectChildById = (id: string) => {
    const idx = wards.findIndex((w) => w.id === id || w.studentProfileId === id);
    if (idx !== -1) {
      setSelectedChildIndex(idx);
    }
  };

  const selectedChild = wards[selectedChildIndex] || null;

  return (
    <ParentChildContext.Provider
      value={{
        children: wards,
        selectedChild,
        selectedChildIndex,
        setSelectedChildIndex,
        selectChildById,
        loading,
        error,
        refreshChildren: fetchChildren,
      }}
    >
      {children}
    </ParentChildContext.Provider>
  );
};

export const useParentChild = (): ParentChildContextType => {
  const context = useContext(ParentChildContext);
  if (!context) {
    throw new Error('useParentChild must be used within a ParentChildProvider');
  }
  return context;
};

/**
 * Reusable Universal Child Switcher Bar for all Parent Portal pages.
 */
export const ParentChildSwitcherBar: React.FC = () => {
  const { children, selectedChildIndex, setSelectedChildIndex, loading } = useParentChild();

  if (loading && children.length === 0) {
    return (
      <div className="ed-card" style={{ padding: '12px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading linked student records...</span>
      </div>
    );
  }

  if (children.length === 0) {
    return null;
  }

  return (
    <div
      className="ed-card"
      style={{
        padding: '12px 18px',
        marginBottom: '20px',
        background: 'linear-gradient(to right, rgba(36, 76, 58, 0.04), rgba(36, 76, 58, 0.01))',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md, 8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
            Switch Active Ward ({children.length} Enrolled {children.length === 1 ? 'Child' : 'Children'})
          </span>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Select child profile to dynamically view their academic data, attendance & fees
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
        {children.map((child, idx) => {
          const isSelected = idx === selectedChildIndex;
          return (
            <button
              key={child.id}
              onClick={() => setSelectedChildIndex(idx)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md, 8px)',
                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
                backgroundColor: isSelected ? 'rgba(36, 76, 58, 0.08)' : 'var(--bg-surface, #ffffff)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none',
                textAlign: 'left',
                minWidth: '220px',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--bg-subtle, #f0f3ee)',
                  color: isSelected ? '#ffffff' : 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                {child.firstName ? child.firstName[0] : 'S'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? 700 : 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {child.fullName}
                  </span>
                  {isSelected && (
                    <CheckCircle2 size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span>{child.className}-{child.sectionName}</span>
                  <span>•</span>
                  <span style={{ fontFamily: 'monospace' }}>{child.admissionNumber}</span>
                </div>
              </div>

              {child.pendingFees > 0 && (
                <span
                  title={`Outstanding fees: ₹${child.pendingFees.toLocaleString('en-IN')}`}
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    flexShrink: 0,
                  }}
                >
                  ₹{child.pendingFees} Due
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

