import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IdCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Building2,
  KeyRound,
  Send,
  UserCheck,
  UserX,
  RefreshCw,
  Sparkles,
  Clock,
  Camera,
  UploadCloud,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import {
  coreApi,
  idCardsApi,
  triggerUserPasswordResetApi,
  updateUserAccountStatusApi,
  resendInvitationApi,
} from '../../services/api.js';

export const StudentDossierPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { branding } = useSchoolBranding();

  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchStudent = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await coreApi.getStudentById(id);
      setStudent(res);
    } catch (err: any) {
      setError(err.message || 'Unable to load student dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleGenerateIdCard = async () => {
    if (!student) return;
    setActionLoading(true);
    try {
      await coreApi.generateIdCard({
        holderType: 'STUDENT',
        profileId: student.id,
      });
      setSuccessToast('New Virtual ID Card successfully issued!');
      await fetchStudent();
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(`ID Card Generation Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        setActionLoading(true);
        const base64 = ev.target?.result as string;
        await idCardsApi.uploadStudentPhoto(student.id, {
          photoData: base64,
          fileName: file.name,
          mimeType: file.type,
        });
        setSuccessToast('Student photograph updated successfully.');
        await fetchStudent();
      } catch (err: any) {
        alert(err.message || 'Failed to upload photo.');
      } finally {
        setActionLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerPasswordReset = async () => {
    if (!student?.account?.userId) return;
    if (!window.confirm(`Send an official password reset link to ${student.account.email}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await triggerUserPasswordResetApi(student.account.userId);
      setSuccessToast(res.message || 'Password reset link sent to student email.');
      await fetchStudent();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(`Failed to trigger password reset: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAccountStatus = async () => {
    if (!student?.account?.userId) return;
    const isCurrentlyActive = Boolean(student.account.isActive);
    const actionWord = isCurrentlyActive ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionWord} this student's account access?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await updateUserAccountStatusApi(
        student.account.userId,
        !isCurrentlyActive,
        `${isCurrentlyActive ? 'Suspended' : 'Reactivated'} via Student Dossier`
      );
      setSuccessToast(`Student account successfully ${isCurrentlyActive ? 'suspended' : 'reactivated'}.`);
      await fetchStudent();
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(`Status Update Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvitation = async () => {
    const invId = student?.account?.invitation?.id;
    if (!invId) return;
    setActionLoading(true);
    try {
      await resendInvitationApi(invId);
      setSuccessToast('Fresh activation invitation dispatched to student email.');
      await fetchStudent();
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(`Failed to resend invitation: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <Loader2 size={32} className="spin-slow" style={{ margin: '0 auto var(--space-3)', color: 'var(--primary-600)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading student dossier from PostgreSQL...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={{ padding: 'var(--space-8)', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <AlertTriangle size={36} style={{ margin: '0 auto var(--space-3)', color: 'var(--danger-600)' }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Dossier Unavailable</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>{error || 'Student record was not found.'}</p>
        <Link to="/admin/students" className="ed-btn ed-btn-secondary">
          <ArrowLeft size={16} /> Return to Student Directory
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Toast */}
      {successToast && (
        <div
          style={{
            marginBottom: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Navigation */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <button
          onClick={() => navigate('/admin/students')}
          className="ed-btn ed-btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} /> Back to Student Directory
        </button>
      </div>

      {/* Header Banner */}
      <div
        className="ed-card"
        style={{
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '68px',
                height: '84px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.4rem',
                overflow: 'hidden',
                border: '2px solid var(--border-default)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
              }}
            >
              {student.photoUrl || student.account?.avatarUrl ? (
                <img
                  src={student.photoUrl || student.account?.avatarUrl}
                  alt={student.firstName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>
                  {student.firstName[0]}
                  {student.lastName[0]}
                </span>
              )}
            </div>
            <label
              title="Upload / Replace Student Photo"
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
              }}
            >
              <Camera size={13} />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                {student.firstName} {student.lastName}
              </h1>
              <Badge variant="success">{student.status || 'ACTIVE'}</Badge>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              <span>Admission No: <strong style={{ fontFamily: 'var(--font-mono)' }}>{student.admissionNumber}</strong></span>
              <span>•</span>
              <span>Class: <strong>{student.className}-{student.sectionName || 'A'}</strong></span>
              <span>•</span>
              <span>Roll: <strong>#{student.rollNumber || 1}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="primary"
            icon={<IdCard size={15} />}
            isLoading={actionLoading}
            onClick={handleGenerateIdCard}
          >
            {student.idCard ? 'Re-Issue ID Card' : 'Generate Virtual ID'}
          </Button>
        </div>
      </div>

      {/* Grid of dossier details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Personal Details */}
        <div className="ed-card" style={{ padding: 'var(--space-5)', backgroundColor: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={16} style={{ color: 'var(--primary-600)' }} /> Personal & Demographics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Gender</span>
              <span style={{ fontWeight: 600 }}>{student.gender || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Blood Group</span>
              <span style={{ fontWeight: 600 }}>{student.bloodGroup || 'O+'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Address</span>
              <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{student.address || '124 Garden Street'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Institution</span>
              <span style={{ fontWeight: 600 }}>{branding.schoolName}</span>
            </div>
          </div>
        </div>

        {/* Guardian / Family Information */}
        <div className="ed-card" style={{ padding: 'var(--space-5)', backgroundColor: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={16} style={{ color: 'var(--primary-600)' }} /> Guardian & Emergency Contacts
          </h3>
          {student.guardians && student.guardians.length > 0 ? (
            student.guardians.map((g: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '8px',
                  fontSize: '0.84rem',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                  {g.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({g.relationship})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <Phone size={12} /> {g.phone || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Mail size={12} /> {g.email || '—'}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No linked guardian information found.</p>
          )}
        </div>

        {/* Student Account & Credentials Management */}
        <div className="ed-card" style={{ padding: 'var(--space-5)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={16} style={{ color: 'var(--primary-600)' }} /> Account & ERP Access
            </h3>
            {student.account && (
              <Badge variant={student.account.isActive ? 'success' : 'danger'}>
                {student.account.isActive ? 'ACCOUNT ACTIVE' : 'SUSPENDED'}
              </Badge>
            )}
          </div>

          {student.account ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Username</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {student.account.username || student.admissionNumber}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Primary Email</span>
                <span style={{ fontWeight: 600 }}>{student.account.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Role</span>
                <span style={{ fontWeight: 600 }}>Student Portal</span>
              </div>

              {student.account.invitation && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Invitation Status</span>
                  <Badge variant={student.account.invitation.status === 'ACCEPTED' ? 'success' : 'warning'}>
                    {student.account.invitation.status}
                  </Badge>
                </div>
              )}

              {student.account.invitation?.assistedCode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assisted Code</span>
                  <code style={{ backgroundColor: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {student.account.invitation.assistedCode}
                  </code>
                </div>
              )}

              {student.account.lastLoginAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Activity</span>
                  <span>{new Date(student.account.lastLoginAt).toLocaleDateString()}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleTriggerPasswordReset}
                    className="ed-btn ed-btn-outline ed-btn-sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.80rem' }}
                    title="Send password reset link to student email"
                  >
                    <Send size={13} /> Send Reset Link
                  </button>

                  {student.account.invitation && student.account.invitation.status !== 'ACCEPTED' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleResendInvitation}
                      className="ed-btn ed-btn-outline ed-btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.80rem' }}
                      title="Dispatch a fresh invitation token"
                    >
                      <RefreshCw size={13} /> Resend Invite
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleToggleAccountStatus}
                  className={`ed-btn ed-btn-sm ${student.account.isActive ? 'ed-btn-outline' : 'ed-btn-primary'}`}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.80rem',
                    color: student.account.isActive ? 'var(--danger-text)' : undefined,
                    borderColor: student.account.isActive ? 'var(--danger-border)' : undefined,
                  }}
                >
                  {student.account.isActive ? (
                    <>
                      <UserX size={13} /> Suspend Student Account
                    </>
                  ) : (
                    <>
                      <UserCheck size={13} /> Reactivate Student Account
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0 0 12px 0' }}>
                No active portal account linked to this admission record.
              </p>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleTriggerPasswordReset}
                className="ed-btn ed-btn-primary ed-btn-sm"
              >
                Provision & Send Credentials
              </button>
            </div>
          )}
        </div>

        {/* ID Card & Security Verification Token */}
        <div className="ed-card" style={{ padding: 'var(--space-5)', backgroundColor: 'var(--bg-surface)', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IdCard size={16} style={{ color: 'var(--primary-600)' }} /> ISO CR80 Virtual ID Card Credential
          </h3>

          {student.idCard ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-6)',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Card Badge Mockup */}
              <div
                style={{
                  width: '320px',
                  height: '200px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header Banner */}
                <div
                  style={{
                    backgroundColor: '#1e3a8a',
                    color: '#ffffff',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '3px solid #d97706',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800 }}>
                      {branding.shortName || 'APEX ACADEMY'}
                    </div>
                    <div style={{ fontSize: '0.54rem', opacity: 0.9 }}>STUDENT CREDENTIAL</div>
                  </div>
                  <Badge variant="success" style={{ fontSize: '0.62rem' }}>
                    {student.idCard.status}
                  </Badge>
                </div>

                {/* Card Body */}
                <div style={{ display: 'flex', padding: '10px 12px', gap: '10px', flex: 1, alignItems: 'center' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '76px',
                      borderRadius: '5px',
                      border: '1.5px solid #1e3a8a',
                      backgroundColor: '#f8fafc',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {student.photoUrl || student.account?.avatarUrl ? (
                      <img
                        src={student.photoUrl || student.account?.avatarUrl}
                        alt={student.firstName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>
                        {student.firstName[0]}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      {student.firstName} {student.lastName}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#1e3a8a', fontWeight: 600 }}>
                      {student.className}-{student.sectionName || 'A'} • Roll #{student.rollNumber || 1}
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '2px' }}>
                      Adm: {student.admissionNumber}
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#fff',
                      padding: '3px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <QrCode size={32} color="#0f172a" />
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.58rem',
                    color: '#64748b',
                  }}
                >
                  <span>{student.idCard.cardNumber}</span>
                  <span style={{ color: '#1e3a8a', fontWeight: 700 }}>ISO CR80</span>
                </div>
              </div>

              {/* Security Details & Public QR Link */}
              <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Card Number: </span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{student.idCard.cardNumber}</strong>
                </div>
                <div style={{ fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cryptographic Token: </span>
                  <code style={{ backgroundColor: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                    {student.idCard.verificationToken}
                  </code>
                </div>
                <div style={{ fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Issued At: </span>
                  <span>{new Date(student.idCard.issuedAt).toLocaleDateString()}</span>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <Link
                    to={`/verify-id/${student.idCard.verificationToken}`}
                    target="_blank"
                    className="ed-btn ed-btn-secondary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                  >
                    <ShieldCheck size={14} /> Open Public Verification Gateway <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '0 0 12px' }}>
                No active Virtual ID Card has been generated for this student.
              </p>
              <Button
                variant="primary"
                icon={<IdCard size={15} />}
                isLoading={actionLoading}
                onClick={handleGenerateIdCard}
              >
                Issue Virtual ID Card Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
