import React, { useState } from 'react';
import { ShieldCheck, KeyRound, AlertCircle, RefreshCw, X } from 'lucide-react';
import { authApi } from '../../services/api';

export interface MfaVerificationModalProps {
  isOpen: boolean;
  mfaToken: string;
  emailMasked?: string;
  onSuccess: (data: { accessToken: string; user: any }) => void;
  onCancel: () => void;
}

export const MfaVerificationModal: React.FC<MfaVerificationModalProps> = ({
  isOpen,
  mfaToken,
  emailMasked,
  onSuccess,
  onCancel,
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setFeedback({ type: 'error', text: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    setVerifying(true);
    setFeedback(null);
    try {
      const res = await authApi.verifyMfa({ mfaToken, otpCode });
      if (res?.data?.accessToken && res?.data?.user) {
        onSuccess(res.data);
      } else if (res?.accessToken && res?.user) {
        onSuccess(res);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Verification failed. Please check the code.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setFeedback(null);
    try {
      const res = await authApi.resendMfa({ mfaToken });
      setFeedback({
        type: 'success',
        text: res?.message || 'A fresh verification code has been dispatched.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to resend code.' });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-start justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Two-Factor Authentication</h3>
              <p className="text-xs text-gray-500">Enhanced account security</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={verifying}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          A 6-digit one-time verification code has been sent to{' '}
          <span className="font-semibold text-gray-800">{emailMasked || 'your registered email'}</span>.
          Please enter the code to confirm authentication.
        </p>

        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              6-Digit Security Code
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full text-center text-lg font-mono tracking-widest pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Didn't receive code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-purple-600 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              Resend Code
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={verifying}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying || otpCode.length !== 6}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Confirm Authentication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

