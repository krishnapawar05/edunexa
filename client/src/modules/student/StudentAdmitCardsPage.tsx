import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  Building,
  Download,
  Printer,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Eye,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { admitCardsApi } from '../../services/api.js';
import {
  downloadIndividualAdmitCardPdf,
  AdmitCardPdfData,
} from '../../utils/admitCardPdf.js';

export const StudentAdmitCardsPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  const loadMyCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await admitCardsApi.getMyAdmitCards();
      if (res?.success && Array.isArray(res.data)) {
        setCards(res.data);
      } else {
        setCards([]);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve published examination admit cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyCards();
  }, []);

  const handleDownload = (c: any) => {
    const pdfData: AdmitCardPdfData = {
      id: c.id,
      admitCardNumber: c.admitCardNumber,
      examTitle: c.examTitle,
      examType: c.examType,
      sessionName: c.academicSession?.name || 'Academic Session 2026-2027',
      studentName: `${c.studentProfile?.user?.firstName || ''} ${c.studentProfile?.user?.lastName || ''}`.trim() || 'Candidate',
      admissionNumber: c.studentProfile?.admissionNumber || 'ADM-0000',
      rollNumber: c.rollNumber || c.studentProfile?.rollNumber || '00',
      className: c.className || c.studentProfile?.class?.name || 'Grade 10',
      sectionName: c.sectionName || c.studentProfile?.section?.name || 'Section A',
      centerName: c.centerName,
      roomNumber: c.roomNumber,
      candidateInstructions: c.candidateInstructions,
      qrToken: c.qrToken,
      status: c.status,
      clearanceStatus: c.clearanceStatus,
      schoolName: branding.schoolName,
      schoolCode: branding.code || 'EDUNEXA-2026',
      schoolAddress: branding.address,
      schoolPhone: branding.contactPhone,
      schoolEmail: branding.contactEmail,
      timetable: Array.isArray(c.timetable) ? c.timetable : [],
    };
    downloadIndividualAdmitCardPdf(pdfData, `AdmitCard_${c.admitCardNumber}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
              Student Workspace
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Official Hall Tickets</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Examination Admit Cards & Hall Tickets
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View, verify, and download your authorized A4 examination hall tickets for upcoming institutional assessments.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadMyCards}
          disabled={loading}
          className="flex items-center gap-2 text-slate-700 border-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Retrieving verified examination hall tickets...</p>
        </div>
      ) : cards.length === 0 ? (
        /* Empty / Not Published Notice */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileCheck className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Published Admit Cards Available</h3>
            <p className="text-sm text-slate-500 mt-2">
              Admit cards are released by the Examination Department once timetables and student institutional clearances (fee settlement & attendance) are finalized.
            </p>
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 text-left">
              <strong>Need Assistance?</strong> If you believe your admit card should be ready, please confirm that your term fee dues are cleared and contact your Class Teacher or Examination Coordinator.
            </div>
          </div>
        </div>
      ) : (
        /* Cards Display */
        <div className="space-y-6">
          {cards.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border-2 border-slate-200 hover:border-indigo-300 transition-all shadow-sm overflow-hidden"
            >
              {/* Card Title Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Official & Published
                    </span>
                    <span className="text-xs text-indigo-200 font-mono">
                      #{c.admitCardNumber}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold mt-1 text-white">{c.examTitle}</h2>
                  <p className="text-xs text-slate-300">
                    {c.academicSession?.name || 'Academic Session 2026-2027'} • Center: {c.centerName} • Room {c.roomNumber || 'Assigned On-Site'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCard(c)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleDownload(c)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download A4 PDF
                  </Button>
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Candidate</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {c.studentProfile?.user?.firstName} {c.studentProfile?.user?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Roll Number</span>
                  <span className="font-bold text-indigo-700 text-sm font-mono">#{c.rollNumber || '00'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Admission Number</span>
                  <span className="font-mono text-slate-800 font-semibold">{c.studentProfile?.admissionNumber || 'ADM-0000'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Class & Section</span>
                  <span className="font-semibold text-slate-800">
                    {c.className || c.studentProfile?.class?.name} ({c.sectionName || c.studentProfile?.section?.name || 'A'})
                  </span>
                </div>
              </div>

              {/* Timetable Table */}
              <div className="p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Subject Examination Papers & Timetable
                </h3>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Time & Duration</th>
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-4">Paper Code</th>
                        <th className="py-2.5 px-4 text-right">Hall / Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.isArray(c.timetable) && c.timetable.length > 0 ? (
                        c.timetable.map((t: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{t.examDate}</td>
                            <td className="py-2.5 px-4 text-slate-700">{t.startTime} ({t.durationMinutes} mins)</td>
                            <td className="py-2.5 px-4 font-bold text-indigo-900">{t.subjectName}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">{t.subjectCode}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-800">{t.roomNumber || c.roomNumber || 'Main Hall'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400">
                            Subject schedule details will appear here as soon as released.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Candidate Instructions */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block mb-1">Important Instructions for Candidates:</span>
                  <p className="whitespace-pre-line leading-relaxed text-[11px]">
                    {c.candidateInstructions || 'Present this printed admit card and institutional ID at the center gate. Electronic devices strictly barred.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW MODAL */}
      {selectedCard && (
        <Modal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title="Admit Card Preview"
          subtitle={`Admit Card #${selectedCard.admitCardNumber}`}
          maxWidth="720px"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setSelectedCard(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownload(selectedCard)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          }
        >
          <div className="p-4 border border-slate-200 rounded-lg space-y-4 text-xs">
            <div className="text-center border-b pb-2">
              <h2 className="text-base font-bold text-slate-900 uppercase">{branding.schoolName}</h2>
              <p className="text-[11px] text-slate-500">{selectedCard.examTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Candidate</span>
                <span className="font-bold text-slate-900">{selectedCard.studentProfile?.user?.firstName} {selectedCard.studentProfile?.user?.lastName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Roll Number</span>
                <span className="font-bold text-indigo-700">#{selectedCard.rollNumber}</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-1">Examination Papers:</div>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-semibold text-[10px]">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Subject</th>
                      <th className="p-2">Time</th>
                      <th className="p-2 text-right">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Array.isArray(selectedCard.timetable) && selectedCard.timetable.map((t: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{t.examDate}</td>
                        <td className="p-2 font-bold text-indigo-900">{t.subjectName}</td>
                        <td className="p-2">{t.startTime}</td>
                        <td className="p-2 text-right font-mono">{t.roomNumber || selectedCard.roomNumber || 'TBA'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
