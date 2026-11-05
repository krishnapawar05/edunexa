import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Search,
  ArrowLeft,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { marksheetsApi } from '../../services/api.js';

interface PublicMarksheetVerificationProps {
  initialToken?: string;
  onBackToPublic?: () => void;
}

export const PublicMarksheetVerification: React.FC<PublicMarksheetVerificationProps> = ({
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
      const res = await marksheetsApi.verifyPublicToken(tok.trim());
      if (!res.isValid) {
        throw new Error(res.message || 'Verification token is invalid, revoked, or unauthentic.');
      }
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult(null);
      setErrorMessage(err.message || 'Unable to authenticate marksheet token with institutional ledger.');
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
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/20 text-white mb-2">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Marksheet & Credential Verification
          </h1>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            {branding.schoolName || 'Apex International Academy'} Official Public Verification Ledger
          </p>
        </div>

        {/* Token Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Digital Verification Token or QR String
              </label>
              <div className="relative">
                <input
                  id="token"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter ms-tok-... or paste QR credential code"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Institutional Record...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Verify Marksheet Authenticity</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {verificationResult && (
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Top Verification Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/60 text-emerald-600 flex-shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authentic Official Document
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {verificationResult.examTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  Document Serial: <span className="font-mono font-semibold text-slate-700">{verificationResult.marksheetNumber}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-slate-100 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Candidate</span>
                <span className="font-semibold text-slate-800">{verificationResult.studentInitials}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Class / Cohort</span>
                <span className="font-semibold text-slate-800">{verificationResult.className}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Academic Session</span>
                <span className="font-semibold text-slate-800">{verificationResult.academicSession}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Cumulative Grade</span>
                <span className="font-bold text-emerald-700">{verificationResult.grade} ({verificationResult.overallPercentage}%)</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Result Standing</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {verificationResult.division} - {verificationResult.isPassed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Issuance Version</span>
                <span className="font-mono text-slate-700">v{verificationResult.version} • {new Date(verificationResult.issuedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* School Signature Verification */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-800">{verificationResult.schoolName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Tamper-Evident Ledger
              </div>
            </div>
          </div>
        )}

        {/* Error Card */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
            <div className="inline-flex p-2.5 bg-rose-100 text-rose-600 rounded-full mb-1">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-900">Document Verification Failed</h3>
            <p className="text-xs text-rose-700 max-w-sm mx-auto">{errorMessage}</p>
            <p className="text-xs text-slate-400">
              If you received a physical marksheet, verify that the QR code URL matches our registered school domain.
            </p>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (onBackToPublic) onBackToPublic();
              else navigate('/');
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Public Website
          </button>
        </div>
      </div>
    </div>
  );
};
