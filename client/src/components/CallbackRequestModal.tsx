import React, { useState } from 'react';
import { PhoneCall, CheckCircle, X, Clock, User, Mail, GraduationCap } from 'lucide-react';
import { marketingApi } from '../services/api';
import { getStoredUtmParams, trackGa4Event } from '../utils/utmTracker';

interface CallbackRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
}

export const CallbackRequestModal: React.FC<CallbackRequestModalProps> = ({
  isOpen,
  onClose,
  schoolName = 'Apex Academy',
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [applyingClass, setApplyingClass] = useState('Grade 1');
  const [preferredTime, setPreferredTime] = useState('Morning (9:00 AM - 12:00 PM)');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('Please provide your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const utm = getStoredUtmParams();
      const res = await marketingApi.submitCallback({
        fullName,
        phone,
        email: email.trim() || undefined,
        applyingClass,
        preferredTime,
        message: message.trim() || undefined,
        utmSource: utm.utmSource || undefined,
        utmMedium: utm.utmMedium || undefined,
        utmCampaign: utm.utmCampaign || undefined,
      });

      setSubmittedRequestNumber(res?.data?.requestNumber || 'CB-2026-0001');

      // Dispatch GA4 event
      trackGa4Event('generate_lead', {
        event_category: 'Admissions',
        event_label: 'Callback Request',
        value: 1,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedRequestNumber(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Request an Instant Callback</h3>
              <p className="text-xs text-emerald-100 font-medium">Connect with an Admissions Counsellor at {schoolName}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body or Success State */}
        <div className="p-6">
          {submittedRequestNumber ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Callback Scheduled!</h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Thank you, <strong>{fullName}</strong>. An admissions specialist will call you at{' '}
                <span className="font-semibold text-slate-800">{phone}</span> during your preferred time window.
              </p>
              <div className="inline-block px-4 py-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-700">
                Reference ID: <span className="font-bold text-emerald-700">{submittedRequestNumber}</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm transition"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400" /> Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Class Seeking Admission
                  </label>
                  <select
                    value={applyingClass}
                    onChange={(e) => setApplyingClass(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition"
                  >
                    <option value="Nursery / Kindergarten">Nursery / Kindergarten</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11 - Science">Grade 11 - Science</option>
                    <option value="Grade 11 - Commerce">Grade 11 - Commerce</option>
                    <option value="Grade 11 - Humanities">Grade 11 - Humanities</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Preferred Call Time
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition"
                  >
                    <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                    <option value="Afternoon (12:00 PM - 3:00 PM)">Afternoon (12:00 PM - 3:00 PM)</option>
                    <option value="Evening (3:00 PM - 6:00 PM)">Evening (3:00 PM - 6:00 PM)</option>
                    <option value="Anytime during school hours">Anytime during school hours</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Specific Query or Requirements (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ask about school bus routes, sports facilities, syllabus, fee concession..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                By submitting this form, you consent to receive calls or WhatsApp updates regarding admissions from {schoolName}.
              </p>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <PhoneCall className="w-3.5 h-3.5" /> Request Call
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

