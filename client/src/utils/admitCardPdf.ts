import { jsPDF } from 'jspdf';
import { AdmitCardTimetableEntry } from '@edunexa/shared';

export interface AdmitCardPdfData {
  id?: string;
  admitCardNumber: string;
  examTitle: string;
  examType?: string;
  sessionName?: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  centerName: string;
  roomNumber?: string;
  candidateInstructions?: string;
  qrToken?: string;
  status?: string;
  clearanceStatus?: string;
  schoolName?: string;
  schoolCode?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  timetable: AdmitCardTimetableEntry[];
}

/**
 * Draw a single full-page official A4 examination admit card on the specified jsPDF doc.
 */
export function drawAdmitCardOnDoc(doc: jsPDF, data: AdmitCardPdfData): void {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const schoolName = (data.schoolName || 'EduNexa Central Academy').toUpperCase();
  const schoolCode = data.schoolCode || 'EDUNEXA-2026';
  const schoolAddress = data.schoolAddress || 'Institutional Campus, Knowledge Promenade';
  const schoolPhone = data.schoolPhone || '+91 98765 43210';
  const schoolEmail = data.schoolEmail || 'examinations@edunexa.edu';
  const session = data.sessionName || 'Academic Year 2026–2027';
  const examTitle = (data.examTitle || 'Mid-Term Examination 2026').toUpperCase();

  // 1. Double Institutional Security Border
  doc.setDrawColor(15, 41, 30); // Forest Navy
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  doc.setDrawColor(212, 175, 55); // Academic Gold Accent
  doc.setLineWidth(0.3);
  doc.rect(margin + 1.5, margin + 1.5, contentWidth - 3, pageHeight - margin * 2 - 3);

  // 2. Header Banner Background
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, 32, 'F');

  // School Monogram Shield
  doc.setFillColor(15, 41, 30);
  doc.roundedRect(margin + 6, margin + 6, 20, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(schoolName.charAt(0) || 'E', margin + 16, margin + 20, { align: 'center' });

  // School Title & Contact
  doc.setTextColor(15, 41, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(schoolName, margin + 30, margin + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${schoolAddress} • Tel: ${schoolPhone} • Email: ${schoolEmail}`, margin + 30, margin + 18);
  doc.text(`Affiliation Code: ${schoolCode} • Continuous Evaluation Board`, margin + 30, margin + 23);

  // 3. Hall Ticket Badge Ribbon
  doc.setFillColor(15, 41, 30);
  doc.rect(margin + 2, margin + 34, contentWidth - 4, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`OFFICIAL EXAMINATION ADMIT CARD / HALL TICKET — ${session}`, pageWidth / 2, margin + 40.5, {
    align: 'center',
  });

  // 4. Candidate & Examination Details Grid
  let curY = margin + 48;

  // Candidate Photograph Placeholder
  const photoW = 28;
  const photoH = 34;
  const photoX = margin + contentWidth - photoW - 6;
  const photoY = curY;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.rect(photoX, photoY, photoW, photoH);
  doc.setFillColor(241, 245, 249);
  doc.rect(photoX + 0.2, photoY + 0.2, photoW - 0.4, photoH - 0.4, 'F');

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.text('AFFIX RECENT', photoX + photoW / 2, photoY + 14, { align: 'center' });
  doc.text('PASSPORT', photoX + photoW / 2, photoY + 18, { align: 'center' });
  doc.text('PHOTOGRAPH', photoX + photoW / 2, photoY + 22, { align: 'center' });

  // Details Table (Left Column)
  const colWidth = photoX - margin - 8;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + 4, curY, colWidth, 34, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin + 4, curY, colWidth, 34);

  const drawRow = (label1: string, val1: string, label2: string, val2: string, yOffset: number) => {
    const yPos = curY + yOffset;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label1, margin + 8, yPos);
    doc.text(label2, margin + colWidth / 2 + 4, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val1, margin + 38, yPos);
    doc.text(val2, margin + colWidth / 2 + 36, yPos);
  };

  drawRow('Candidate Name:', (data.studentName || '—').toUpperCase(), 'Admission No:', data.admissionNumber || '—', 7);
  drawRow('Roll Number:', data.rollNumber || '—', 'Class & Sec:', `${data.className} - ${data.sectionName}`, 14);
  drawRow('Examination:', examTitle, 'Admit Card No:', data.admitCardNumber || '—', 21);
  drawRow('Exam Center:', data.centerName || 'Main Campus', 'Room / Hall:', data.roomNumber || 'Hall A', 28);

  curY += 40;

  // 5. Subject Timetable Section Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin + 4, curY, contentWidth - 8, 7, 'F');
  doc.setTextColor(15, 41, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SUBJECT-WISE EXAMINATION TIMETABLE & INVIGILATOR VERIFICATION', margin + 8, curY + 5);

  curY += 7;

  // Timetable Header
  const headers = [
    { label: '#', w: 10, align: 'center' as const },
    { label: 'Subject Name & Code', w: 54, align: 'left' as const },
    { label: 'Date', w: 25, align: 'center' as const },
    { label: 'Day', w: 24, align: 'center' as const },
    { label: 'Timing', w: 28, align: 'center' as const },
    { label: 'Room', w: 22, align: 'center' as const },
    { label: 'Invigilator Sign', w: 23, align: 'center' as const },
  ];

  doc.setFillColor(15, 41, 30);
  doc.rect(margin + 4, curY, contentWidth - 8, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);

  let curX = margin + 4;
  headers.forEach((h) => {
    const textX = h.align === 'center' ? curX + h.w / 2 : curX + 2;
    doc.text(h.label, textX, curY + 4.5, { align: h.align });
    curX += h.w;
  });

  curY += 6.5;

  // Timetable Rows
  const rows = data.timetable && data.timetable.length > 0 ? data.timetable : [];
  if (rows.length === 0) {
    // Fallback placeholder schedule if no subjects configured
    rows.push({
      subjectName: 'General Comprehensive Assessment',
      subjectCode: 'GEN-101',
      examDate: '2026-11-15',
      dayOfWeek: 'Monday',
      startTime: '09:30',
      endTime: '12:30',
      durationMinutes: 180,
      roomNumber: data.roomNumber || 'Hall A',
      maxMarks: 100,
    });
  }

  rows.forEach((item, idx) => {
    const rowH = 7.5;
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin + 4, curY, contentWidth - 8, rowH, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.rect(margin + 4, curY, contentWidth - 8, rowH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);

    let cellX = margin + 4;
    // 1. Index
    doc.text(String(idx + 1), cellX + headers[0].w / 2, curY + 5, { align: 'center' });
    cellX += headers[0].w;

    // 2. Subject Name & Code
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.subjectName} (${item.subjectCode})`, cellX + 2, curY + 5);
    doc.setFont('helvetica', 'normal');
    cellX += headers[1].w;

    // 3. Date
    doc.text(item.examDate, cellX + headers[2].w / 2, curY + 5, { align: 'center' });
    cellX += headers[2].w;

    // 4. Day
    doc.text(item.dayOfWeek, cellX + headers[3].w / 2, curY + 5, { align: 'center' });
    cellX += headers[3].w;

    // 5. Timing
    doc.text(`${item.startTime} - ${item.endTime}`, cellX + headers[4].w / 2, curY + 5, { align: 'center' });
    cellX += headers[4].w;

    // 6. Room
    doc.text(item.roomNumber || 'Hall A', cellX + headers[5].w / 2, curY + 5, { align: 'center' });
    cellX += headers[5].w;

    // 7. Signature Box line
    doc.text('[               ]', cellX + headers[6].w / 2, curY + 5, { align: 'center' });

    curY += rowH;
  });

  curY += 8;

  // 6. Instructions Box
  doc.setFillColor(254, 252, 232); // Amber light tint
  doc.rect(margin + 4, curY, contentWidth - 8, 48, 'F');
  doc.setDrawColor(254, 240, 138);
  doc.rect(margin + 4, curY, contentWidth - 8, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(133, 77, 14); // Dark Amber
  doc.text('CRITICAL CANDIDATE INSTRUCTIONS & EXAMINATION CODE OF CONDUCT', margin + 8, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);

  const instructions = [
    '1. Reporting Time: Candidates must report to the allocated examination center at least 30 minutes before the scheduled start time.',
    '2. Mandatory Credentials: No candidate will be admitted into the examination hall without presenting this Admit Card and official Student ID badge.',
    '3. Prohibited Articles: Cellular phones, smartwatches, programmable calculators, bags, and unauthorized written materials are strictly banned inside the hall.',
    '4. Seating Protocol: Candidates must occupy their allotted seats as designated on the center display board and remain seated until answer sheets are collected.',
    '5. Disciplinary Rules: Any form of malpractice, communication with fellow candidates, or unauthorized movement will lead to immediate cancellation of candidature.',
    '6. Verification: The room invigilator must sign in the allocated column after verifying candidate identity and hall ticket barcode.',
  ];

  let instY = curY + 11;
  instructions.forEach((line) => {
    doc.text(line, margin + 8, instY);
    instY += 5.8;
  });

  curY += 56;

  // 7. Signatures & Stamp Footer
  const signColW = (contentWidth - 8) / 3;

  // Candidate Signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('__________________________________', margin + 8 + signColW * 0.1, curY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature of the Candidate', margin + 8 + signColW * 0.1, curY + 21);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('(To be signed in presence of Invigilator)', margin + 8 + signColW * 0.1, curY + 25);

  // Controller / Invigilator Sign
  const col2X = margin + 4 + signColW;
  doc.text('__________________________________', col2X + signColW * 0.1, curY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Room Invigilator Verification', col2X + signColW * 0.1, curY + 21);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Verified Identity & Seating Allocation', col2X + signColW * 0.1, curY + 25);

  // Principal / Controller Sign + Institutional Seal Box
  const col3X = margin + 4 + signColW * 2;
  doc.text('__________________________________', col3X + signColW * 0.1, curY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Principal & Controller of Examinations', col3X + signColW * 0.1, curY + 21);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Apex Academy Certified Digitally', col3X + signColW * 0.1, curY + 25);

  // Simulated QR Code Block & Verification Footer
  const footerY = pageHeight - margin - 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin + 4, footerY, margin + contentWidth - 4, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const token = data.qrToken || 'ac-tok-verified';
  doc.text(
    `EduNexa Examination Registry System • Token ID: ${token} • Generated: ${new Date().toLocaleDateString()}`,
    margin + 6,
    footerY + 4
  );
  doc.text(`Page 1 of 1 (Strictly Confidential)`, margin + contentWidth - 6, footerY + 4, { align: 'right' });
}

/**
 * Generate Individual Admit Card PDF document.
 */
export function generateIndividualAdmitCardPdf(data: AdmitCardPdfData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  drawAdmitCardOnDoc(doc, data);
  return doc;
}

/**
 * Download Individual Admit Card PDF.
 */
export function downloadIndividualAdmitCardPdf(
  data: AdmitCardPdfData,
  fileName?: string
): void {
  const doc = generateIndividualAdmitCardPdf(data);
  const cleanAdmission = (data.admissionNumber || 'candidate').replace(/[^a-zA-Z0-9_-]/g, '');
  const finalName = fileName || `Admit-Card-${cleanAdmission}.pdf`;
  doc.save(finalName);
}

/**
 * Generate Bulk Admit Cards PDF (Multi-Page A4 Sheet).
 * Formats one candidate per page cleanly.
 */
export function generateBulkAdmitCardsPdf(cards: AdmitCardPdfData[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  cards.forEach((card, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'portrait');
    }
    drawAdmitCardOnDoc(doc, card);
  });

  return doc;
}

/**
 * Download Bulk Admit Cards PDF.
 */
export function downloadBulkAdmitCardsPdf(
  cards: AdmitCardPdfData[],
  fileName = 'Admit-Cards-Batch.pdf'
): void {
  const doc = generateBulkAdmitCardsPdf(cards);
  doc.save(fileName);
}

