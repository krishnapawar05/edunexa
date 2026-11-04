import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Search,
  ArrowLeft,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { admitCardsApi } from '../../services/api.js';

interface PublicAdmitCardVerificationProps {
  initialToken?: string;
  onBackToPublic?: () => void;
}

export const PublicAdmitCardVerification: React.FC<PublicAdmitCardVerificationProps> = ({
  initialToken,
  onBackToPublic,
}) => {
  const { branding } = useSchoolBranding();
  const routeParams = useParams<{ token?: string }>();
  const navigate = useNavigate();

  const effectiveToken = routeParams.token || initialToken || '';
  const [tokenInput, setTokenInput] = useState(effectiveToken);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchVerification = async (tok: string) => {
    if (!tok.trim()) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await admitCardsApi.verifyAdmitCardToken(tok.trim());
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Verification token is invalid or does not exist.');
      }
      setVerificationResult(res.data);
    } catch (err: any) {
      setVerificationResult(null);
      setErrorMessage(err.message || 'Unable to verify examination hall ticket token.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveToken) {
      fetchVerification(effectiveToken);
    }
  }, [effectiveToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      fetchVerification(tokenInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 text-white mb-2">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admit Card & Hall Ticket Verification
          </h1>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            {branding.schoolName || 'EduNexa Central Academy'} Public Examination Credential Verifier
          </p>
        </div>

        {/* Search / Token Input Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cryptographic Token or Admit Card Code
              </label>
              <div className="relative">
                <input
                  id="token"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter QR token or paste credential verification string"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !tokenInput.trim()}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {loading ? (
                    'Verifying...'
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      Verify
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Verification Status Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                Invalid or Unverified Credential
              </div>
              <p className="text-xs text-rose-700 pl-7">{errorMessage}</p>
            </div>
          )}

          {verificationResult && (
            <div className="space-y-5 pt-2">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  verificationResult.status === 'PUBLISHED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {verificationResult.status === 'PUBLISHED' ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-7 h-7 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-extrabold text-sm sm:text-base">
                      {verificationResult.status === 'PUBLISHED'
                        ? 'AUTHENTIC & PUBLISHED ADMIT CARD'
                        : `ADMIT CARD STATUS: ${verificationResult.status}`}
                    </div>
                    <div className="text-xs opacity-90">
                      Clearance: {verificationResult.clearanceStatus}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="p-3 bg-slate-50 flex items-center justify-between font-bold text-slate-800">
                  <span>Admit Card Number</span>
                  <span className="font-mono text-indigo-700">{verificationResult.admitCardNumber}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Candidate Name</span>
                  <span className="font-bold text-slate-900">{verificationResult.studentName}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Class & Section</span>
                  <span className="font-semibold text-slate-800">
                    {verificationResult.className} ({verificationResult.sectionName})
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Candidate Roll Number</span>
                  <span className="font-mono font-bold text-slate-900">#{verificationResult.rollNumber}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Examination Title</span>
                  <span className="font-bold text-indigo-900">{verificationResult.examTitle}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Assigned Center</span>
                  <span className="font-medium text-slate-800">{verificationResult.centerName}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Room / Hall</span>
                  <span className="font-mono font-bold text-slate-800">{verificationResult.roomNumber || 'TBA'}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Issuing Institution</span>
                  <span className="font-medium text-slate-800">{verificationResult.schoolName}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back navigation */}
        <div className="text-center">
          <button
            onClick={() => {
              if (onBackToPublic) onBackToPublic();
              else navigate('/');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to School Portal
          </button>
        </div>
      </div>
    </div>
  );
};

