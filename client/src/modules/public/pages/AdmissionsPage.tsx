import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  FileText,
  Download,
  Search,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  AlertCircle,
  Shield,
  FileCheck,
  Building,
  GraduationCap,
  Copy,
  Check,
  Sparkles,
  Camera,
  Trash2,
} from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';
import { admissionsApi } from '../../../services/api.js';
import { downloadAdmissionFormPdf } from '../../../utils/admissionFormPdf.js';

type TabType = 'apply' | 'track' | 'guidelines' | 'downloads';

export const AdmissionsPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [activeTab, setActiveTab] = useState<TabType>('apply');
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Multi-step Application State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppNo, setSubmittedAppNo] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [copiedAppNo, setCopiedAppNo] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    // Step 1: Student Details
    studentFirstName: '',
    studentLastName: '',
    studentEmail: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: '',
    residentialAddress: '',

    // Step 2: Guardian Details
    guardianName: '',
    guardianRelationship: 'Father',
    fatherName: '',
    motherName: '',
    guardianEmail: '',
    guardianPhone: '',

    // Step 3: Academic Details
    applyingClass: 'Grade 9',
    previousSchool: '',
    previousClass: 'Grade 8',
    marksPercentage: '',

    // Step 4: Documents Uploaded
    uploadedDocs: {} as Record<
      string,
      { fileName: string; fileSize?: string; uploadedAt: string; fileUrl?: string; previewUrl?: string }
    >,

    // Step 5: Declaration
    declarationAgreed: false,
  });

  // Track Status State
  const [trackQuery, setTrackQuery] = useState({
    applicationNumber: '',
    verificationContact: '',
  });
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Fetch Public Config
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const res = await admissionsApi.getPublicConfig('apex-academy');
        if (isMounted) {
          const cfg = (res as any).data || res;
          setConfig(cfg);
          if (cfg.classes && cfg.classes.length > 0) {
            setFormData((prev) => ({ ...prev, applyingClass: cfg.classes[0].name }));
          }
        }
      } catch (err) {
        console.warn('Failed to load admission configuration', err);
      } finally {
        if (isMounted) setLoadingConfig(false);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownloadPdf = () => {
    downloadAdmissionFormPdf({
      schoolName: config?.school?.name || branding.schoolName,
      schoolCode: config?.school?.code || 'APEX-EDU',
      schoolAddress: config?.school?.address || branding.address,
      schoolPhone: config?.school?.phone || branding.contactPhone,
      schoolEmail: config?.school?.email || 'admissions@apexacademy.edu',
      academicSession: config?.admissionSession || '2026–2027',
      requiredDocuments: config?.requiredDocuments,
    });
  };

  const handleCopyAppNo = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAppNo(true);
    setTimeout(() => setCopiedAppNo(false), 2000);
  };

  // Centralized File & Passport Photograph Upload Handler
  const handleFileUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setSubmissionError(null);

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSubmissionError('File size exceeds the 5MB limit. Please upload a smaller file.');
      return;
    }

    const isPhoto = docType === 'STUDENT_PHOTO' || docType === 'PASSPORT_PHOTO';
    const isImage = file.type.startsWith('image/');

    if (isPhoto) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowed.includes(file.type.toLowerCase())) {
        setSubmissionError('Student photograph must be a JPG, PNG, or WebP image file.');
        return;
      }
    }

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const previewUrl = ev.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          uploadedDocs: {
            ...prev.uploadedDocs,
            [docType]: {
              fileName: file.name,
              fileSize: `${(file.size / 1024).toFixed(1)} KB`,
              uploadedAt: new Date().toISOString(),
              fileUrl: previewUrl,
              previewUrl,
            },
            ...(isPhoto
              ? {
                  STUDENT_PHOTO: {
                    fileName: file.name,
                    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
                    uploadedAt: new Date().toISOString(),
                    fileUrl: previewUrl,
                    previewUrl,
                  },
                  PASSPORT_PHOTO: {
                    fileName: file.name,
                    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
                    uploadedAt: new Date().toISOString(),
                    fileUrl: previewUrl,
                    previewUrl,
                  },
                }
              : {}),
          },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        uploadedDocs: {
          ...prev.uploadedDocs,
          [docType]: {
            fileName: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            uploadedAt: new Date().toISOString(),
            fileUrl: `/uploads/admissions/${file.name}`,
          },
        },
      }));
    }
  };

  const handleRemoveDoc = (docType: string) => {
    setFormData((prev) => {
      const copy = { ...prev.uploadedDocs };
      delete copy[docType];
      if (docType === 'STUDENT_PHOTO' || docType === 'PASSPORT_PHOTO') {
        delete copy['STUDENT_PHOTO'];
        delete copy['PASSPORT_PHOTO'];
      }
      return { ...prev, uploadedDocs: copy };
    });
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setSubmissionError(null);
    if (step === 1) {
      if (!formData.studentFirstName.trim() || !formData.studentLastName.trim()) {
        setSubmissionError('Please provide both the student first and last name.');
        return false;
      }
      if (!formData.dateOfBirth) {
        setSubmissionError('Please provide the date of birth.');
        return false;
      }
      if (!formData.residentialAddress.trim()) {
        setSubmissionError('Please provide the student residential address.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.guardianName.trim()) {
        setSubmissionError('Please provide the primary guardian full name.');
        return false;
      }
      if (!formData.guardianEmail.trim() || !formData.guardianEmail.includes('@')) {
        setSubmissionError('Please enter a valid parent email address.');
        return false;
      }
      if (!formData.guardianPhone.trim() || formData.guardianPhone.trim().length < 8) {
        setSubmissionError('Please enter a valid 10-digit telephone number.');
        return false;
      }
    } else if (step === 3) {
      if (!formData.applyingClass) {
        setSubmissionError('Please select the grade / class applying for.');
        return false;
      }
    } else if (step === 4) {
      // Validate mandatory documents
      const docs = config?.requiredDocuments || [];
      for (const d of docs) {
        if (d.isRequired && !formData.uploadedDocs[d.type]) {
          setSubmissionError(`Mandatory document required: ${d.label}`);
          return false;
        }
      }
    } else if (step === 5) {
      if (!formData.declarationAgreed) {
        setSubmissionError('You must agree to the institutional rules and parental declaration.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setSubmissionError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitApplication = async () => {
    if (!validateStep(5)) return;

    try {
      setIsSubmitting(true);
      setSubmissionError(null);

      const docsPayload = Object.entries(formData.uploadedDocs).map(([type, val]) => ({
        type,
        fileName: val.fileName,
        fileUrl: (val as any).fileUrl || `/uploads/admissions/${val.fileName}`,
        uploadedAt: val.uploadedAt,
      }));

      const payload = {
        studentFirstName: formData.studentFirstName.trim(),
        studentLastName: formData.studentLastName.trim(),
        studentEmail: formData.studentEmail.trim() || undefined,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || undefined,
        residentialAddress: formData.residentialAddress.trim(),
        guardianName: formData.guardianName.trim(),
        guardianRelationship: formData.guardianRelationship || 'Parent',
        fatherName: formData.fatherName.trim() || undefined,
        motherName: formData.motherName.trim() || undefined,
        guardianEmail: formData.guardianEmail.trim().toLowerCase(),
        guardianPhone: formData.guardianPhone.trim(),
        applyingClass: formData.applyingClass,
        academicSession: config?.admissionSession || '2026–2027',
        previousSchool: formData.previousSchool.trim() || undefined,
        previousClass: formData.previousClass.trim() || undefined,
        marksPercentage: formData.marksPercentage ? parseFloat(formData.marksPercentage) : undefined,
        documents: docsPayload,
        declarationAgreed: formData.declarationAgreed,
      };

      const res = await admissionsApi.submitApplication(payload, 'apex-academy');
      const appNo = (res as any).data?.applicationNumber || (res as any).applicationNumber || 'APP-2026-DONE';
      setSubmittedAppNo(appNo);
    } catch (err: any) {
      setSubmissionError(err.message || 'Failed to submit application. Please check your entries.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackResult(null);

    const appNo = trackQuery.applicationNumber.trim().toUpperCase();
    const contact = trackQuery.verificationContact.trim();

    if (!appNo) {
      setTrackError('Please provide the Application Reference Number (e.g. APP-2026-XXXX).');
      return;
    }
    if (!contact) {
      setTrackError('Please provide the Parent Email or Phone used during registration.');
      return;
    }

    try {
      setIsTracking(true);
      const res = await admissionsApi.trackStatus({
        applicationNumber: appNo,
        verificationContact: contact,
      });
      setTrackResult((res as any).data || res);
    } catch (err: any) {
      setTrackError(err.message || 'No application found matching these credentials.');
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return <span className="ed-badge ed-badge-success">FORMALLY ENROLLED</span>;
      case 'APPROVED':
        return <span className="ed-badge ed-badge-success">APPROVED — SEAT OFFERED</span>;
      case 'DOCUMENTS_REQUIRED':
        return <span className="ed-badge ed-badge-warning">DOCUMENTS REQUIRED</span>;
      case 'UNDER_REVIEW':
        return <span className="ed-badge ed-badge-info">UNDER COMMITTEE REVIEW</span>;
      case 'REJECTED':
        return <span className="ed-badge ed-badge-danger">APPLICATION DECLINED</span>;
      default:
        return <span className="ed-badge ed-badge-secondary">SUBMITTED</span>;
    }
  };

  return (
    <div className="ed-public-container" style={{ padding: 'var(--space-8) 0' }}>
      {/* Hero Banner */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.80rem', fontWeight: 600, marginBottom: '12px' }}>
          <Sparkles size={15} color="#2563eb" />
          <span>ADMISSIONS OPEN FOR ACADEMIC YEAR {config?.admissionSession || '2026–2027'}</span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
          {config?.admissionNoticeTitle || 'Admissions & Enrollment Portal'}
        </h1>
        <p style={{ maxWidth: '750px', margin: '0 auto', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {config?.admissionNoticeDesc ||
            'Join our distinguished academic community. Submit an online application, verify document requirements, or download the official printable application form.'}
        </p>

        {/* Global Action Bar */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('apply')}
            className={`ed-btn ${activeTab === 'apply' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.88rem' }}
          >
            <GraduationCap size={18} />
            Apply Online (Interactive)
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`ed-btn ${activeTab === 'track' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.88rem' }}
          >
            <Search size={18} />
            Track Application Status
          </button>
          <button
            onClick={handleDownloadPdf}
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.88rem', borderColor: '#3b82f6', color: '#1e40af' }}
          >
            <Download size={18} />
            Download Printable Form (PDF)
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-default)',
          marginBottom: '28px',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveTab('apply')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'apply' ? '3px solid #1e40af' : '3px solid transparent',
            color: activeTab === 'apply' ? '#1e40af' : 'var(--text-muted)',
            fontWeight: activeTab === 'apply' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileText size={16} />
          Online Application Form
        </button>
        <button
          onClick={() => setActiveTab('track')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'track' ? '3px solid #1e40af' : '3px solid transparent',
            color: activeTab === 'track' ? '#1e40af' : 'var(--text-muted)',
            fontWeight: activeTab === 'track' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={16} />
          Application Tracker
        </button>
        <button
          onClick={() => setActiveTab('guidelines')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'guidelines' ? '3px solid #1e40af' : '3px solid transparent',
            color: activeTab === 'guidelines' ? '#1e40af' : 'var(--text-muted)',
            fontWeight: activeTab === 'guidelines' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Calendar size={16} />
          Eligibility & Timetable
        </button>
        <button
          onClick={() => setActiveTab('downloads')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'downloads' ? '3px solid #1e40af' : '3px solid transparent',
            color: activeTab === 'downloads' ? '#1e40af' : 'var(--text-muted)',
            fontWeight: activeTab === 'downloads' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Download size={16} />
          Official Downloads & Documents
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ONLINE APPLICATION MULTI-STEP FORM */}
      {/* ========================================================================= */}
      {activeTab === 'apply' && (
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {submittedAppNo ? (
            <div
              className="ed-card ed-card-body"
              style={{ textAlign: 'center', padding: '40px 24px', backgroundColor: 'var(--bg-surface)' }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <CheckCircle size={42} />
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Application Successfully Submitted!
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 24px' }}>
                Your admission application has been registered directly into the school ledger. Please note your official application reference number below:
              </p>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#f1f5f9',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: '2px dashed #2563eb',
                  marginBottom: '24px',
                }}
              >
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e40af', letterSpacing: '0.05em' }}>
                  {submittedAppNo}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyAppNo(submittedAppNo)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copiedAppNo ? '#16a34a' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.80rem',
                    fontWeight: 600,
                  }}
                >
                  {copiedAppNo ? <Check size={16} /> : <Copy size={16} />}
                  {copiedAppNo ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '8px',
                  padding: '18px 24px',
                  maxWidth: '560px',
                  margin: '0 auto 28px',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>What Happens Next?</div>
                <div>1. Our admissions committee reviews your submitted data and attached certificates.</div>
                <div>2. You will receive an email/SMS notification regarding assessment scheduling.</div>
                <div>3. You can track application progress anytime in the <strong>Track Application Status</strong> tab above.</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setSubmittedAppNo(null);
                    setCurrentStep(1);
                    setFormData({
                      studentFirstName: '',
                      studentLastName: '',
                      studentEmail: '',
                      dateOfBirth: '',
                      gender: 'MALE',
                      bloodGroup: '',
                      residentialAddress: '',
                      guardianName: '',
                      guardianRelationship: 'Father',
                      fatherName: '',
                      motherName: '',
                      guardianEmail: '',
                      guardianPhone: '',
                      applyingClass: config?.classes?.[0]?.name || 'Grade 9',
                      previousSchool: '',
                      previousClass: 'Grade 8',
                      marksPercentage: '',
                      uploadedDocs: {},
                      declarationAgreed: false,
                    });
                  }}
                  className="ed-btn ed-btn-secondary"
                  style={{ fontSize: '0.88rem' }}
                >
                  Submit Another Application
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="ed-btn ed-btn-primary"
                  style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={16} />
                  Download Official Printable Copy
                </button>
              </div>
            </div>
          ) : (
            <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
              {/* Step Tracker Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '28px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid var(--border-default)',
                }}
              >
                {[
                  { step: 1, label: 'Student' },
                  { step: 2, label: 'Guardians' },
                  { step: 3, label: 'Academics' },
                  { step: 4, label: 'Documents' },
                  { step: 5, label: 'Review' },
                ].map((s) => {
                  const isDone = currentStep > s.step;
                  const isCurrent = currentStep === s.step;
                  return (
                    <div
                      key={s.step}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: isDone ? '#16a34a' : isCurrent ? '#1e40af' : '#e2e8f0',
                          color: isDone || isCurrent ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          marginBottom: '6px',
                        }}
                      >
                        {isDone ? <Check size={18} /> : s.step}
                      </div>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCurrent ? '#1e40af' : 'var(--text-muted)',
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {submissionError && (
                <div
                  style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #f87171',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* STEP 1: STUDENT DETAILS */}
              {currentStep === 1 && (
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Step 1: Student Particulars</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Enter official identity information as stated on the birth certificate.
                  </p>

                  {/* Passport-Size Photograph Upload */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      padding: '16px 20px',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '10px',
                      marginBottom: '20px',
                    }}
                  >
                    <div
                      style={{
                        width: '84px',
                        height: '104px',
                        borderRadius: '6px',
                        border: '2px dashed var(--border-default)',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      {formData.uploadedDocs['STUDENT_PHOTO']?.previewUrl ||
                      formData.uploadedDocs['PASSPORT_PHOTO']?.previewUrl ? (
                        <img
                          src={
                            formData.uploadedDocs['STUDENT_PHOTO']?.previewUrl ||
                            formData.uploadedDocs['PASSPORT_PHOTO']?.previewUrl
                          }
                          alt="Student Passport"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '6px' }}>
                          <Camera size={26} color="#94a3b8" style={{ margin: '0 auto 4px' }} />
                          <span style={{ fontSize: '0.62rem', color: '#94a3b8', lineHeight: 1.1, display: 'block' }}>
                            Passport Photo
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          Student Passport Photograph
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor:
                              formData.uploadedDocs['STUDENT_PHOTO'] || formData.uploadedDocs['PASSPORT_PHOTO']
                                ? '#dcfce7'
                                : '#fef3c7',
                            color:
                              formData.uploadedDocs['STUDENT_PHOTO'] || formData.uploadedDocs['PASSPORT_PHOTO']
                                ? '#166534'
                                : '#92400e',
                            fontWeight: 600,
                          }}
                        >
                          {formData.uploadedDocs['STUDENT_PHOTO'] || formData.uploadedDocs['PASSPORT_PHOTO']
                            ? 'Uploaded'
                            : 'Recommended / Required'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        Official passport-size portrait with clear background. This photograph will be printed on your
                        official ISO CR80 Student Virtual ID Card and examination admit cards.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <label
                          className="ed-btn ed-btn-secondary"
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <UploadCloud size={14} />
                          {formData.uploadedDocs['STUDENT_PHOTO'] || formData.uploadedDocs['PASSPORT_PHOTO']
                            ? 'Replace Photograph'
                            : 'Upload Photograph'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload('STUDENT_PHOTO', e)}
                          />
                        </label>

                        {(formData.uploadedDocs['STUDENT_PHOTO'] || formData.uploadedDocs['PASSPORT_PHOTO']) && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc('STUDENT_PHOTO')}
                            className="ed-btn"
                            style={{
                              fontSize: '0.78rem',
                              padding: '6px 12px',
                              color: '#dc2626',
                              backgroundColor: '#fee2e2',
                              border: '1px solid #fecaca',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Accepted: JPG, PNG, WebP (Max 5MB)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                    <div className="ed-input-group">
                      <label className="ed-label">First Name *</label>
                      <input
                        required
                        type="text"
                        className="ed-input"
                        placeholder="e.g. Aryan"
                        value={formData.studentFirstName}
                        onChange={(e) => setFormData({ ...formData, studentFirstName: e.target.value })}
                      />
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Last Name *</label>
                      <input
                        required
                        type="text"
                        className="ed-input"
                        placeholder="e.g. Sharma"
                        value={formData.studentLastName}
                        onChange={(e) => setFormData({ ...formData, studentLastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                    <div className="ed-input-group">
                      <label className="ed-label">Date of Birth *</label>
                      <input
                        required
                        type="date"
                        className="ed-input"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Gender *</label>
                      <select
                        className="ed-input"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Blood Group</label>
                      <select
                        className="ed-input"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      >
                        <option value="">Select...</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div className="ed-input-group" style={{ marginBottom: '14px' }}>
                    <label className="ed-label">Student Email (Optional)</label>
                    <input
                      type="email"
                      className="ed-input"
                      placeholder="student@apexacademy.edu (if student has an individual email)"
                      value={formData.studentEmail}
                      onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    />
                  </div>

                  <div className="ed-input-group" style={{ marginBottom: '20px' }}>
                    <label className="ed-label">Permanent Residential Address *</label>
                    <textarea
                      required
                      className="ed-input"
                      rows={3}
                      placeholder="Flat/House No, Street, Landmark, City, State, PIN Code"
                      value={formData.residentialAddress}
                      onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: PARENT / GUARDIAN DETAILS */}
              {currentStep === 2 && (
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Step 2: Parent / Guardian Information</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Primary communication regarding admission outcome and verification will be sent here.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '14px' }}>
                    <div className="ed-input-group">
                      <label className="ed-label">Primary Guardian Full Name *</label>
                      <input
                        required
                        type="text"
                        className="ed-input"
                        placeholder="e.g. Ramesh Sharma"
                        value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      />
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Relationship *</label>
                      <select
                        className="ed-input"
                        value={formData.guardianRelationship}
                        onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                    <div className="ed-input-group">
                      <label className="ed-label">Father's Name (Optional)</label>
                      <input
                        type="text"
                        className="ed-input"
                        placeholder="e.g. Ramesh Sharma"
                        value={formData.fatherName}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      />
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Mother's Name (Optional)</label>
                      <input
                        type="text"
                        className="ed-input"
                        placeholder="e.g. Sunita Sharma"
                        value={formData.motherName}
                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="ed-input-group">
                      <label className="ed-label">Parent / Guardian Contact Phone *</label>
                      <input
                        required
                        type="tel"
                        className="ed-input"
                        placeholder="+91 98450 12345"
                        value={formData.guardianPhone}
                        onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      />
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Parent / Guardian Email Address *</label>
                      <input
                        required
                        type="email"
                        className="ed-input"
                        placeholder="parent@domain.com"
                        value={formData.guardianEmail}
                        onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ACADEMIC DETAILS */}
              {currentStep === 3 && (
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Step 3: Academic Details & Class Selection</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Select target grade and indicate previous school records for grade placement.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                    <div className="ed-input-group">
                      <label className="ed-label">Applying For Class / Grade *</label>
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

                    <div className="ed-input-group">
                      <label className="ed-label">Target Academic Session</label>
                      <input
                        disabled
                        className="ed-input"
                        value={config?.admissionSession || '2026–2027'}
                        style={{ backgroundColor: 'var(--bg-subtle)' }}
                      />
                    </div>
                  </div>

                  <div className="ed-input-group" style={{ marginBottom: '14px' }}>
                    <label className="ed-label">Previous School Attended (if applicable)</label>
                    <input
                      type="text"
                      className="ed-input"
                      placeholder="e.g. St. Xavier's High School"
                      value={formData.previousSchool}
                      onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="ed-input-group">
                      <label className="ed-label">Last Class Completed</label>
                      <input
                        type="text"
                        className="ed-input"
                        placeholder="e.g. Grade 8"
                        value={formData.previousClass}
                        onChange={(e) => setFormData({ ...formData, previousClass: e.target.value })}
                      />
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Aggregate Marks / Percentage %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="ed-input"
                        placeholder="e.g. 88.5"
                        value={formData.marksPercentage}
                        onChange={(e) => setFormData({ ...formData, marksPercentage: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: DOCUMENT UPLOAD */}
              {currentStep === 4 && (
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Step 4: Supporting Document Upload</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Attach clear scans or PDF documents. Mandatory requirements must be fulfilled before final submission.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                    {(config?.requiredDocuments || [
                      { type: 'BIRTH_CERTIFICATE', label: 'Birth Certificate (Municipal / Registrar)', isRequired: true },
                      { type: 'PREVIOUS_MARKSHEET', label: 'Previous Academic Year Marksheet', isRequired: true },
                      { type: 'TRANSFER_CERTIFICATE', label: 'Transfer Certificate (TC)', isRequired: false },
                      { type: 'STUDENT_PHOTO', label: 'Student Photograph (Passport Size)', isRequired: true },
                      { type: 'GUARDIAN_ID', label: 'Parent / Guardian Government ID', isRequired: true },
                    ]).map((docItem: any) => {
                      const uploaded = formData.uploadedDocs[docItem.type];
                      return (
                        <div
                          key={docItem.type}
                          style={{
                            border: uploaded ? '1px solid #86efac' : '1px solid var(--border-default)',
                            borderRadius: '8px',
                            padding: '14px 16px',
                            backgroundColor: uploaded ? '#f0fdf4' : 'var(--bg-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {uploaded?.previewUrl && (
                              <img
                                src={uploaded.previewUrl}
                                alt={docItem.label}
                                style={{
                                  width: '42px',
                                  height: '52px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: '1px solid #86efac',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{docItem.label}</span>
                                {docItem.isRequired ? (
                                  <span style={{ color: '#dc2626', fontWeight: 700 }}>*</span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Optional)</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {uploaded ? (
                                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                    ✓ Uploaded: {uploaded.fileName} ({uploaded.fileSize})
                                  </span>
                                ) : (
                                  <span>Accepted: PDF, JPG, PNG, WebP (Max 5MB)</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label
                              className="ed-btn ed-btn-secondary"
                              style={{
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                padding: '6px 14px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <UploadCloud size={14} />
                              {uploaded ? 'Replace' : 'Upload File'}
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.webp"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileUpload(docItem.type, e)}
                              />
                            </label>
                            {uploaded && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc(docItem.type)}
                                className="ed-btn"
                                title="Remove file"
                                style={{
                                  padding: '6px 8px',
                                  color: '#dc2626',
                                  backgroundColor: '#fee2e2',
                                  border: '1px solid #fecaca',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & DECLARATION */}
              {currentStep === 5 && (
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Step 5: Review & Parental Declaration</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Verify your entered information before committing to the institutional database.
                  </p>

                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Student: </span>
                        <strong>{formData.studentFirstName} {formData.studentLastName}</strong> ({formData.gender})
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>DOB: </span>
                        <strong>{formData.dateOfBirth}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Class Applied: </span>
                        <strong>{formData.applyingClass}</strong> ({config?.admissionSession || '2026–2027'})
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Guardian: </span>
                        <strong>{formData.guardianName}</strong> ({formData.guardianRelationship})
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Contact: </span>
                        <strong>{formData.guardianPhone}</strong> | {formData.guardianEmail}
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Documents Uploaded: </span>
                        <strong>{Object.keys(formData.uploadedDocs).length} files attached</strong>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      border: '1px solid #bfdbfe',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      padding: '14px',
                      marginBottom: '20px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.declarationAgreed}
                        onChange={(e) => setFormData({ ...formData, declarationAgreed: e.target.checked })}
                        style={{ marginTop: '3px' }}
                      />
                      <span style={{ fontSize: '0.80rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                        <strong>Parental Declaration:</strong> I hereby certify that the information supplied in this application is accurate and true. I understand that admission is subject to verification of credentials, interview, and seat availability. I agree to abide by the disciplinary rules and fee schedule of the school.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="ed-btn ed-btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="ed-btn ed-btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting}
                    className="ed-btn ed-btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.90rem',
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    }}
                  >
                    {isSubmitting ? 'Transmitting to School Ledger...' : 'Submit Application'}
                    <FileCheck size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPLICATION TRACKER */}
      {/* ========================================================================= */}
      {activeTab === 'track' && (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Track Admission Application</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Enter your application number and registered phone or email to check real-time committee review status.
            </p>

            {trackError && (
              <div
                style={{
                  padding: '10px 14px',
                  marginBottom: '16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #f87171',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '0.84rem',
                }}
              >
                {trackError}
              </div>
            )}

            <form onSubmit={handleTrackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="ed-input-group">
                <label className="ed-label">Application Reference Number *</label>
                <input
                  required
                  type="text"
                  className="ed-input"
                  placeholder="e.g. APP-2026-0842"
                  value={trackQuery.applicationNumber}
                  onChange={(e) => setTrackQuery({ ...trackQuery, applicationNumber: e.target.value })}
                />
              </div>

              <div className="ed-input-group">
                <label className="ed-label">Parent Registered Email or Contact Phone *</label>
                <input
                  required
                  type="text"
                  className="ed-input"
                  placeholder="e.g. parent@domain.com or +91 98450 00000"
                  value={trackQuery.verificationContact}
                  onChange={(e) => setTrackQuery({ ...trackQuery, verificationContact: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isTracking}
                className="ed-btn ed-btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.88rem',
                  padding: '10px',
                }}
              >
                <Search size={16} />
                {isTracking ? 'Verifying Ledger Records...' : 'Check Status'}
              </button>
            </form>

            {/* Tracking Result View */}
            {trackResult && (
              <div
                style={{
                  marginTop: '28px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>APPLICATION NO.</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e40af' }}>
                      {trackResult.applicationNumber}
                    </div>
                  </div>
                  <div>{getStatusBadge(trackResult.status)}</div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    fontSize: '0.84rem',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Candidate: </span>
                    <strong>{trackResult.studentName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Grade Applied: </span>
                    <strong>{trackResult.applyingClass}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Academic Session: </span>
                    <strong>{trackResult.academicSession}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Submission Date: </span>
                    <strong>{new Date(trackResult.createdAt).toLocaleDateString()}</strong>
                  </div>
                </div>

                {/* Missing Documents Alert */}
                {trackResult.missingDocuments && trackResult.missingDocuments.length > 0 && (
                  <div
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      <AlertCircle size={16} />
                      Action Required: Missing Documents Requested by Admissions Council
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.80rem', color: '#92400e' }}>
                      {trackResult.missingDocuments.map((m: any, idx: number) => (
                        <li key={idx}>
                          <strong>{m.type}:</strong> {m.notes || 'Please email or submit physical certified copy to school office.'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {trackResult.reviewNotes && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                    <strong>Council Remarks:</strong> {trackResult.reviewNotes}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ELIGIBILITY & TIMETABLE */}
      {/* ========================================================================= */}
      {activeTab === 'guidelines' && (
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Important Dates */}
          <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#1e40af" />
              Admission Calendar & Milestones ({config?.admissionSession || '2026–2027'})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Applications Open</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e40af', marginTop: '4px' }}>
                  {config?.admissionDates?.applicationStartDate || 'January 15, 2026'}
                </div>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Final Submission Deadline</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
                  {config?.admissionDates?.applicationDeadline || 'April 30, 2026'}
                </div>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parent Orientation</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                  {config?.admissionDates?.orientationDate || 'May 15, 2026'}
                </div>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Session Starts</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                  {config?.admissionDates?.sessionCommencement || 'June 01, 2026'}
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility Matrix */}
          <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="#1e40af" />
              Grade-Wise Eligibility & Age Criteria
            </h3>
            <table className="ed-table" style={{ fontSize: '0.84rem' }}>
              <thead>
                <tr>
                  <th>Target Grade Level</th>
                  <th>Age Requirement (as of June 1)</th>
                  <th>Prerequisite Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {(config?.admissionEligibility || [
                  { grade: 'Grade 1', age: '6 Years', prerequisite: 'Kindergarten Completion' },
                  { grade: 'Grade 6 (Middle)', age: '11 Years', prerequisite: 'Grade 5 Clearance' },
                  { grade: 'Grade 9 (Secondary)', age: '14 Years', prerequisite: 'Grade 8 Clearance' },
                  { grade: 'Grade 11 (Senior Sec)', age: '16 Years', prerequisite: 'CBSE Class 10 Board Passed' },
                ]).map((el: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{el.grade}</td>
                    <td>{el.age}</td>
                    <td>{el.prerequisite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Procedure Timeline */}
          <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Institutional Admission Procedure</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(config?.admissionProcedure || [
                { step: 1, title: 'Online Application', desc: 'Submit the verified online application form to receive a persistent tracking reference.' },
                { step: 2, title: 'Document Verification', desc: 'Upload mandatory birth certification, marksheets, and parent ID documents.' },
                { step: 3, title: 'Faculty Interaction', desc: 'Short informal cognitive interaction and campus orientation visit.' },
                { step: 4, title: 'Admission Decision', desc: 'Admissions council review and classroom section allocation.' },
                { step: 5, title: 'Formal Enrollment', desc: 'Generation of permanent admission number and ISO CR80 digital student ID card.' },
              ]).map((proc: any) => (
                <div key={proc.step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#1e40af',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      flexShrink: 0,
                    }}
                  >
                    {proc.step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{proc.title}</div>
                    <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '2px' }}>{proc.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: OFFICIAL DOWNLOADS & DOCUMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'downloads' && (
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Printable Form Card */}
          <div
            className="ed-card ed-card-body"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '2px solid #93c5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText size={30} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {config?.admissionFormTitle || 'Official Admission Application Form 2026–27'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Standard school-branded A4 printable document formatted for offline submission with signature blocks.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              className="ed-btn ed-btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '0.88rem',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              }}
            >
              <Download size={16} />
              Download Form (PDF)
            </button>
          </div>

          {/* Required Documents Checklist */}
          <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="#1e40af" />
              Required Document Enclosures for Verification
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              The following certificates must be submitted either via the online portal upload or physically attested copies during campus interview:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(config?.requiredDocuments || [
                { type: 'BIRTH_CERTIFICATE', label: 'Birth Certificate (Municipal / Registrar)', isRequired: true, description: 'Official municipal registration copy' },
                { type: 'PREVIOUS_MARKSHEET', label: 'Previous Academic Year Marksheet', isRequired: true, description: 'Final report card of preceding grade' },
                { type: 'TRANSFER_CERTIFICATE', label: 'Transfer Certificate (TC)', isRequired: false, description: 'Original counter-signed TC' },
                { type: 'STUDENT_PHOTO', label: 'Student Photograph (Passport Size)', isRequired: true, description: '4 recent colored portraits' },
                { type: 'GUARDIAN_ID', label: 'Parent / Guardian Government ID', isRequired: true, description: 'Aadhaar / Passport / Voter ID' },
              ]).map((docItem: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      {docItem.label}
                    </div>
                    {docItem.description && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {docItem.description}
                      </div>
                    )}
                  </div>
                  <div>
                    {docItem.isRequired ? (
                      <span className="ed-badge ed-badge-danger" style={{ fontSize: '0.70rem' }}>MANDATORY</span>
                    ) : (
                      <span className="ed-badge ed-badge-secondary" style={{ fontSize: '0.70rem' }}>OPTIONAL</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
