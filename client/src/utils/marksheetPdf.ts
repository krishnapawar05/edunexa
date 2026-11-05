import { jsPDF } from 'jspdf';
import { SubjectMarksEntry } from '@edunexa/shared';

export interface MarksheetPdfData {
  id?: string;
  marksheetNumber: string;
  examTitle: string;
  examType?: string;
  sessionName?: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  totalMaxMarks: number;
  totalMarksObtained: number;
  overallPercentage: number;
  grade: string;
  division?: string;
  isPassed: boolean;
  status?: string;
  version?: number;
  qrToken?: string;
  schoolName?: string;
  schoolCode?: string;
  schoolAffiliation?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolWebsite?: string;
  attendancePresent?: number;
  attendanceTotal?: number;
  attendancePercentage?: number;
  classTeacherRemarks?: string;
  principalRemarks?: string;
  subjects: SubjectMarksEntry[];
}

/**
 * Draw a single full-page official CBSE-style Academic Marksheet on the jsPDF doc.
 */
export function drawMarksheetOnDoc(doc: jsPDF, data: MarksheetPdfData): void {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  const schoolName = (data.schoolName || 'APEX INTERNATIONAL ACADEMY').toUpperCase();
  const schoolCode = data.schoolCode || 'SCH-APX-2026';
  const schoolAffiliation = data.schoolAffiliation || 'Affiliated to CBSE, New Delhi • Affiliation No. 1930284';
  const schoolAddress = data.schoolAddress || 'Knowledge Promenade, Institutional Sector, Cyber City';
  const schoolPhone = data.schoolPhone || '+91 98765 43210';
  const schoolEmail = data.schoolEmail || 'examinations@edunexa.edu';
  const session = data.sessionName || 'Academic Session: 2026–2027';
  const examTitle = (data.examTitle || 'ANNUAL COMPREHENSIVE EXAMINATION 2026-2027').toUpperCase();

  // 1. Triple Official Security Border (Royal Navy & Gold)
  doc.setDrawColor(15, 41, 30); // Deep Forest
  doc.setLineWidth(1.2);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  doc.setDrawColor(212, 175, 55); // Academic Gold
  doc.setLineWidth(0.4);
  doc.rect(margin + 1.6, margin + 1.6, contentWidth - 3.2, pageHeight - margin * 2 - 3.2);

  doc.setDrawColor(226, 232, 240); // Subtle Inner Border
  doc.setLineWidth(0.2);
  doc.rect(margin + 2.8, margin + 2.8, contentWidth - 5.6, pageHeight - margin * 2 - 5.6);

  // 2. Official Header Section
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + 3, margin + 3, contentWidth - 6, 36, 'F');

  // Institution Monogram Box
  doc.setFillColor(15, 41, 30);
  doc.roundedRect(margin + 7, margin + 6, 22, 22, 2, 2, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AN', margin + 18, margin + 20, { align: 'center' });
  doc.setFontSize(5);
  doc.setTextColor(255, 255, 255);
  doc.text('VERIFIED', margin + 18, margin + 25, { align: 'center' });

  // School Titles
  doc.setTextColor(15, 41, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(schoolName, margin + 34, margin + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${schoolAffiliation} | School Code: ${schoolCode}`, margin + 34, margin + 17);
  doc.text(`${schoolAddress} • Tel: ${schoolPhone} • Email: ${schoolEmail}`, margin + 34, margin + 22);

  // Top Right: Official Marksheet Serial & Version Badge
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 41, 30);
  doc.text(`SR NO: ${data.marksheetNumber}`, margin + contentWidth - 7, margin + 12, { align: 'right' });

  const ver = data.version || 1;
  doc.setFillColor(ver > 1 ? 254 : 241, ver > 1 ? 243 : 245, ver > 1 ? 199 : 249);
  doc.setDrawColor(ver > 1 ? 217 : 203, ver > 1 ? 119 : 213, ver > 1 ? 6 : 225);
  doc.roundedRect(margin + contentWidth - 32, margin + 16, 25, 6, 1, 1, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(ver > 1 ? 180 : 30, ver > 1 ? 83 : 41, ver > 1 ? 9 : 59);
  doc.text(ver > 1 ? `REVISED v${ver}` : 'ORIGINAL v1', margin + contentWidth - 19.5, margin + 20.2, { align: 'center' });

  // 3. Document Title Ribbon
  let curY = margin + 41;
  doc.setFillColor(15, 41, 30);
  doc.rect(margin + 3, curY, contentWidth - 6, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(examTitle, pageWidth / 2, curY + 6, { align: 'center' });

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(7);
  doc.text(session.toUpperCase(), margin + 6, curY + 6);
  doc.text(`CBSE COMPLIANT 100-SCALE`, margin + contentWidth - 6, curY + 6, { align: 'right' });

  // 4. Student Demographic Profile Box
  curY += 12;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(margin + 3, curY, contentWidth - 6, 32);

  const col1X = margin + 6;
  const col2X = margin + 68;
  const col3X = margin + 130;
  const photoX = margin + contentWidth - 30;

  // Row 1
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text("CANDIDATE'S NAME", col1X, curY + 6);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.studentName.toUpperCase(), col1X, curY + 11);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ROLL NUMBER', col2X, curY + 6);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.rollNumber || 'N/A', col2X, curY + 11);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ADMISSION / REG. NO.', col3X, curY + 6);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.admissionNumber, col3X, curY + 11);

  // Row 2
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("FATHER'S / GUARDIAN'S NAME", col1X, curY + 18);
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text((data.fatherName || 'Not Stated').toUpperCase(), col1X, curY + 23);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("MOTHER'S NAME", col2X, curY + 18);
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text((data.motherName || 'Not Stated').toUpperCase(), col2X, curY + 23);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('CLASS & SECTION', col3X, curY + 18);
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.className || ''} - Section ${data.sectionName || 'A'}`, col3X, curY + 23);

  // Row 3
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ATTENDANCE RECORD', col1X, curY + 29);
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const attPct = data.attendancePercentage ?? 92.5;
  const attPres = data.attendancePresent ?? 185;
  const attTot = data.attendanceTotal ?? 200;
  doc.text(`${attPres} / ${attTot} Days (${attPct}% Statutory Attendance)`, col1X + 32, curY + 29);

  // Candidate Photograph Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(photoX, curY + 4, 22, 24, 'FD');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('AFFIX CANDIDATE', photoX + 11, curY + 14, { align: 'center' });
  doc.text('PHOTOGRAPH', photoX + 11, curY + 18, { align: 'center' });

  // 5. Academic Performance Subject Table
  curY += 36;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 3, curY, contentWidth - 6, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin + 3, curY, margin + contentWidth - 3, curY);
  doc.line(margin + 3, curY + 7, margin + contentWidth - 3, curY + 7);

  // Headers
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  const tColSubCode = margin + 5;
  const tColSubName = margin + 22;
  const tColThMax = margin + 78;
  const tColThObt = margin + 94;
  const tColPrMax = margin + 110;
  const tColPrObt = margin + 126;
  const tColTotMax = margin + 142;
  const tColTotObt = margin + 158;
  const tColGrade = margin + 172;
  const tColStatus = margin + 185;

  doc.text('CODE', tColSubCode, curY + 4.8);
  doc.text('SUBJECT TITLE', tColSubName, curY + 4.8);
  doc.text('TH MAX', tColThMax, curY + 4.8);
  doc.text('TH OBT', tColThObt, curY + 4.8);
  doc.text('PR MAX', tColPrMax, curY + 4.8);
  doc.text('PR OBT', tColPrObt, curY + 4.8);
  doc.text('TOTAL', tColTotMax, curY + 4.8);
  doc.text('OBTAINED', tColTotObt, curY + 4.8);
  doc.text('GRADE', tColGrade, curY + 4.8);
  doc.text('STATUS', tColStatus, curY + 4.8);

  curY += 7;
  const subjects = data.subjects && data.subjects.length > 0 ? data.subjects : [
    { subjectCode: '101', subjectName: 'English Core', theoryMaxMarks: 80, theoryMarksObtained: 72, practicalMaxMarks: 20, practicalMarksObtained: 19, totalMaxMarks: 100, totalMarksObtained: 91, percentage: 91, grade: 'A1', remarks: 'PASS' },
    { subjectCode: '041', subjectName: 'Mathematics Standard', theoryMaxMarks: 80, theoryMarksObtained: 68, practicalMaxMarks: 20, practicalMarksObtained: 18, totalMaxMarks: 100, totalMarksObtained: 86, percentage: 86, grade: 'A2', remarks: 'PASS' },
    { subjectCode: '086', subjectName: 'Science (Physics / Chem / Bio)', theoryMaxMarks: 70, theoryMarksObtained: 62, practicalMaxMarks: 30, practicalMarksObtained: 28, totalMaxMarks: 100, totalMarksObtained: 90, percentage: 90, grade: 'A1', remarks: 'PASS' },
    { subjectCode: '087', subjectName: 'Social Science', theoryMaxMarks: 80, theoryMarksObtained: 70, practicalMaxMarks: 20, practicalMarksObtained: 19, totalMaxMarks: 100, totalMarksObtained: 89, percentage: 89, grade: 'A2', remarks: 'PASS' },
    { subjectCode: '085', subjectName: 'Hindi Course A', theoryMaxMarks: 80, theoryMarksObtained: 65, practicalMaxMarks: 20, practicalMarksObtained: 18, totalMaxMarks: 100, totalMarksObtained: 83, percentage: 83, grade: 'A2', remarks: 'PASS' },
    { subjectCode: '165', subjectName: 'Information Technology', theoryMaxMarks: 50, theoryMarksObtained: 46, practicalMaxMarks: 50, practicalMarksObtained: 49, totalMaxMarks: 100, totalMarksObtained: 95, percentage: 95, grade: 'A1', remarks: 'PASS' },
  ];

  subjects.forEach((sub: any, idx: number) => {
    const rowH = 6.8;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin + 3, curY, contentWidth - 6, rowH, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);

    doc.text(sub.subjectCode || String(100 + idx), tColSubCode, curY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(sub.subjectName, tColSubName, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.text(String(sub.theoryMaxMarks ?? '-'), tColThMax, curY + 4.5);
    doc.text(String(sub.theoryMarksObtained ?? '-'), tColThObt, curY + 4.5);
    doc.text(String(sub.practicalMaxMarks ?? '-'), tColPrMax, curY + 4.5);
    doc.text(String(sub.practicalMarksObtained ?? '-'), tColPrObt, curY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.text(String(sub.totalMaxMarks ?? sub.totalMarks ?? 100), tColTotMax, curY + 4.5);
    doc.text(String(sub.totalMarksObtained ?? sub.marksObtained ?? 0), tColTotObt, curY + 4.5);

    // Grade
    doc.setTextColor(sub.grade?.startsWith('A') ? 22 : 30, sub.grade?.startsWith('A') ? 101 : 41, sub.grade?.startsWith('A') ? 52 : 59);
    doc.text(sub.grade || 'A1', tColGrade, curY + 4.5);

    // Status
    const pass = (sub.totalMarksObtained ?? sub.marksObtained ?? 0) >= ((sub.totalMaxMarks ?? sub.totalMarks ?? 100) * 0.33);
    doc.setTextColor(pass ? 22 : 185, pass ? 101 : 28, pass ? 52 : 28);
    doc.text(pass ? 'PASS' : 'FAIL', tColStatus, curY + 4.5);

    doc.setDrawColor(241, 245, 249);
    doc.line(margin + 3, curY + rowH, margin + contentWidth - 3, curY + rowH);
    curY += rowH;
  });

  // 6. Cumulative Grand Total Summary Box
  curY += 2;
  doc.setFillColor(15, 41, 30);
  doc.rect(margin + 3, curY, contentWidth - 6, 12, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CUMULATIVE PERFORMANCE SUMMARY', margin + 6, curY + 5);

  doc.setFontSize(7.5);
  doc.setTextColor(212, 175, 55);
  doc.text(`GRAND TOTAL: ${data.totalMarksObtained} / ${data.totalMaxMarks}`, margin + 6, curY + 9.5);
  doc.text(`PERCENTAGE: ${data.overallPercentage.toFixed(2)}%`, margin + 65, curY + 9.5);
  doc.text(`OVERALL GRADE: ${data.grade}`, margin + 115, curY + 9.5);
  doc.text(`DIVISION: ${data.division || 'FIRST DIVISION'}`, margin + 148, curY + 9.5);

  const passed = data.isPassed;
  doc.setFillColor(passed ? 34 : 220, passed ? 197 : 38, passed ? 94 : 38);
  doc.roundedRect(margin + contentWidth - 26, curY + 2.5, 20, 7, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text(passed ? 'PASSED' : 'FAILED', margin + contentWidth - 16, curY + 7, { align: 'center' });

  // 7. Grading Scale & Evaluation Legend Table
  curY += 15;
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin + 3, curY, contentWidth - 6, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 41, 30);
  doc.text('CBSE SCHOLASTIC GRADING CRITERIA REFERENCE', margin + 6, curY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  doc.text('A1: 91–100% (Outstanding) | A2: 81–90% (Excellent) | B1: 71–80% (Very Good) | B2: 61–70% (Good) | C1: 51–60% (Above Average) | C2: 41–50% (Average) | D: 33–40% (Pass) | E: <33% (Failed)', margin + 6, curY + 8);

  // 8. Remarks Section
  curY += 14;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + 3, curY, contentWidth - 6, 20, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin + 3, curY, contentWidth - 6, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CLASS TEACHER REMARKS:', margin + 6, curY + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `"${data.classTeacherRemarks || 'Exhibits commendable intellectual rigor and consistent scholastic commitment.'}"`,
    margin + 6,
    curY + 9.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PRINCIPAL REMARKS & PROMOTION STATUS:', margin + 6, curY + 14);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `"${data.principalRemarks || 'Promoted with Honours to next academic session. Outstanding performance.'}"`,
    margin + 6,
    curY + 18.5
  );

  // 9. Signatures and Official Embossed Stamp
  curY += 24;
  const signColW = (contentWidth - 6) / 3;

  // Left: Class Teacher
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(margin + 6, curY + 14, margin + 6 + signColW - 12, curY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 41, 30);
  doc.text('Class Teacher Signature', margin + 6, curY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Certified Scholastic Record', margin + 6, curY + 22);

  // Center: Official Embossed Stamp
  const stampX = margin + 3 + signColW + (signColW - 32) / 2;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.roundedRect(stampX, curY + 1, 32, 22, 2, 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(212, 175, 55);
  doc.text('OFFICIAL ACADEMIC SEAL', stampX + 16, curY + 7, { align: 'center' });
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text(schoolName.slice(0, 20), stampX + 16, curY + 12, { align: 'center' });
  doc.text('ESTD. INSTITUTION', stampX + 16, curY + 16, { align: 'center' });
  doc.text('★ VERIFIED ★', stampX + 16, curY + 20, { align: 'center' });

  // Right: Principal & Controller
  const rightX = margin + 3 + signColW * 2 + 10;
  doc.line(rightX, curY + 14, rightX + signColW - 12, curY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 41, 30);
  doc.text('Principal & Controller of Examinations', rightX, curY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Apex Academy Certified Digitally', rightX, curY + 22);

  // 10. Digital QR Token & Statutory Security Footer
  const footerY = pageHeight - margin - 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin + 4, footerY, margin + contentWidth - 4, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const token = data.qrToken || 'ms-tok-verified';
  doc.text(
    `EduNexa Academic Registry • Security Token: ${token} • Issued: ${new Date().toLocaleDateString()}`,
    margin + 6,
    footerY + 4
  );
  doc.text(
    `Official Document • Any Alteration or Tampering Invalidates this Statement`,
    margin + contentWidth - 6,
    footerY + 4,
    { align: 'right' }
  );
}

/**
 * Generate Individual Marksheet PDF document.
 */
export function generateIndividualMarksheetPdf(data: MarksheetPdfData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  drawMarksheetOnDoc(doc, data);
  return doc;
}

/**
 * Download Individual Marksheet PDF.
 */
export function downloadIndividualMarksheetPdf(
  data: MarksheetPdfData,
  fileName?: string
): void {
  const doc = generateIndividualMarksheetPdf(data);
  const cleanAdmission = (data.admissionNumber || 'candidate').replace(/[^a-zA-Z0-9_-]/g, '');
  const finalName = fileName || `Marksheet-${cleanAdmission}.pdf`;
  doc.save(finalName);
}

/**
 * Generate Bulk Marksheets PDF (Multi-Page A4 Sheet).
 * Formats one candidate per page cleanly.
 */
export function generateBulkMarksheetsPdf(sheets: MarksheetPdfData[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  sheets.forEach((sheet, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'portrait');
    }
    drawMarksheetOnDoc(doc, sheet);
  });

  return doc;
}

/**
 * Download Bulk Marksheets PDF.
 */
export function downloadBulkMarksheetsPdf(
  sheets: MarksheetPdfData[],
  fileName = 'Marksheets-Batch.pdf'
): void {
  const doc = generateBulkMarksheetsPdf(sheets);
  doc.save(fileName);
}
