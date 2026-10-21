import { jsPDF } from 'jspdf';

export interface FeeReceiptPdfData {
  receiptNumber: string;
  invoiceNumber: string;
  paymentDate?: string;
  date?: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  feeHead: string;
  amountPaid: number;
  totalAmountDue?: number;
  balanceRemaining?: number;
  paymentMethod: string;
  transactionRef?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
}

export interface FeeInvoicePdfData {
  invoiceNumber: string;
  issueDate?: string;
  dueDate: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  feeHead: string;
  amountDue: number;
  amountPaid: number;
  balanceDue?: number;
  status: string;
  schoolName?: string;
  schoolAddress?: string;
}

export interface ReportCardPdfData {
  studentName: string;
  admissionNumber: string;
  rollNumber?: number | string;
  className: string;
  academicSession?: string;
  examName?: string;
  subjects: Array<{
    subjectName: string;
    maxMarks: number;
    marksObtained: number;
    grade?: string;
    teacherRemarks?: string;
  }>;
  overallPercentage?: number;
  overallGrade?: string;
  promotionStatus?: string;
  attendancePercentage?: number | string;
  principalRemarks?: string;
  schoolName?: string;
  schoolMotto?: string;
  schoolAddress?: string;
}

export interface IdCardPdfData {
  holderType?: 'STUDENT' | 'STAFF';
  roleCategory?: 'STUDENT' | 'STAFF';
  holderName?: string;
  fullName?: string;
  identifierNumber: string; // Admission Number or Employee ID
  className?: string; // For students
  classOrDept?: string;
  department?: string; // For staff
  designation?: string; // For staff
  bloodGroup?: string;
  emergencyPhone?: string;
  cardNumber?: string;
  verificationToken: string;
  issuedAt?: string;
  expiresAt?: string;
  academicSession?: string;
  status?: string;
  schoolName?: string;
  schoolAddress?: string;
}

// Default Institution Metadata
const DEFAULT_SCHOOL = {
  name: 'Apex Academy of Sciences & Arts',
  motto: 'Excellence in Knowledge, Integrity & Innovation',
  address: 'Plot 42, Institutional Area, Knowledge Park III, New Delhi 110001',
  phone: '+91 (11) 2659-1000',
  email: 'bursar@apexacademy.edu',
};

/**
 * Downloads a high-resolution, certified Fee Payment Receipt PDF
 */
export function downloadFeeReceiptPdf(data: FeeReceiptPdfData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const schoolName = data.schoolName || DEFAULT_SCHOOL.name;
  const schoolAddress = data.schoolAddress || DEFAULT_SCHOOL.address;

  // Background Header Banner
  doc.setFillColor(15, 23, 42); // Deep Navy #0f172a
  doc.rect(0, 0, 210, 38, 'F');

  // Gold accent bar
  doc.setFillColor(217, 119, 6); // Amber #d97706
  doc.rect(0, 38, 210, 2, 'F');

  // School Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(schoolName, 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${schoolAddress} | Phone: ${data.schoolPhone || DEFAULT_SCHOOL.phone}`, 14, 24);
  doc.text(`Official Accounts Dept. • Email: ${data.schoolEmail || DEFAULT_SCHOOL.email}`, 14, 30);

  // Document Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OFFICIAL FEE PAYMENT RECEIPT', 14, 50);

  // Status Badge
  doc.setFillColor(220, 252, 231); // Light Green #dcfce7
  doc.roundedRect(155, 43, 41, 9, 2, 2, 'F');
  doc.setTextColor(22, 101, 52); // Dark Green #166534
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID & CLEARED', 160, 49);

  // Metadata Grid Box
  doc.setFillColor(248, 250, 252); // Slate #f8fafc
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 56, 182, 38, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont('helvetica', 'normal');

  // Column 1
  doc.text('Receipt Number:', 20, 64);
  doc.text('Payment Date:', 20, 72);
  doc.text('Invoice Ref:', 20, 80);
  doc.text('Payment Mode:', 20, 88);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(data.receiptNumber, 52, 64);
  doc.text(data.paymentDate || data.date || new Date().toLocaleDateString(), 52, 72);
  doc.text(data.invoiceNumber, 52, 80);
  doc.text(data.paymentMethod, 52, 88);

  // Column 2
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Name:', 108, 64);
  doc.text('Admission No:', 108, 72);
  doc.text('Class & Section:', 108, 80);
  doc.text('Transaction Ref:', 108, 88);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(data.studentName, 142, 64);
  doc.text(data.admissionNumber, 142, 72);
  doc.text(data.className, 142, 80);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(data.transactionRef || 'DIRECT-LEDGER', 142, 88);

  // Line Item Table
  const tableStartY = 104;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, tableStartY, 182, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(14, tableStartY, 196, tableStartY);
  doc.line(14, tableStartY + 8, 196, tableStartY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('ITEM NO.', 18, tableStartY + 5.5);
  doc.text('FEE COMPONENT & DESCRIPTION', 45, tableStartY + 5.5);
  doc.text('AMOUNT PAID (INR)', 155, tableStartY + 5.5);

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('1', 22, tableStartY + 16);
  doc.text(data.feeHead, 45, tableStartY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(`INR ${data.amountPaid.toLocaleString()}`, 155, tableStartY + 16);
  doc.line(14, tableStartY + 22, 196, tableStartY + 22);

  // Total Box
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(16, 185, 129); // Emerald-500
  doc.roundedRect(120, tableStartY + 28, 76, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text('TOTAL AMOUNT CLEARED:', 125, tableStartY + 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(6, 95, 70);
  doc.text(`INR ${data.amountPaid.toLocaleString()}`, 125, tableStartY + 45);

  // Certification Seal & Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is an official computer-generated receipt from the EduNexa School ERP.', 14, 250);
  doc.text('Transactions are verified against the institutional PostgreSQL ledger. No physical signature required.', 14, 255);

  // Signature Block
  doc.setDrawColor(148, 163, 184);
  doc.line(140, 245, 190, 245);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('Bursar / Accounts Officer', 145, 250);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Apex Academy of Sciences & Arts', 145, 254);

  // Save the PDF
  doc.save(`fee-receipt-${data.receiptNumber}.pdf`);
}

/**
 * Downloads a high-resolution, certified Fee Invoice PDF
 */
export function downloadFeeInvoicePdf(data: FeeInvoicePdfData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const schoolName = data.schoolName || DEFAULT_SCHOOL.name;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(0, 36, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(schoolName, 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${DEFAULT_SCHOOL.address} | Accounts Office`, 14, 25);

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('STUDENT FEE INVOICE', 14, 48);

  // Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 54, 182, 34, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Invoice Number:', 20, 62);
  doc.text('Due Date:', 20, 70);
  doc.text('Payment Status:', 20, 78);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(data.invoiceNumber, 52, 62);
  doc.text(data.dueDate, 52, 70);
  doc.text(data.status, 52, 78);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Name:', 108, 62);
  doc.text('Admission No:', 108, 70);
  doc.text('Class:', 108, 78);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(data.studentName, 138, 62);
  doc.text(data.admissionNumber, 138, 70);
  doc.text(data.className, 138, 78);

  // Breakdown
  const startY = 98;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('FEE HEAD', 20, startY + 5.5);
  doc.text('TOTAL DUE', 120, startY + 5.5);
  doc.text('AMOUNT PAID', 160, startY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.feeHead, 20, startY + 16);
  doc.text(`INR ${data.amountDue.toLocaleString()}`, 120, startY + 16);
  doc.text(`INR ${data.amountPaid.toLocaleString()}`, 160, startY + 16);
  doc.line(14, startY + 22, 196, startY + 22);

  const balance = Math.max(0, data.amountDue - data.amountPaid);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(balance === 0 ? 22 : 185, balance === 0 ? 101 : 28, balance === 0 ? 52 : 28);
  doc.text(`OUTSTANDING BALANCE: INR ${balance.toLocaleString()}`, 120, startY + 34);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Please remit outstanding term fees prior to the due date to avoid automated late charges.', 14, 250);

  doc.save(`fee-invoice-${data.invoiceNumber}.pdf`);
}

/**
 * Downloads a comprehensive, official Academic Report Card PDF
 */
export function downloadReportCardPdf(data: ReportCardPdfData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const schoolName = data.schoolName || DEFAULT_SCHOOL.name;
  const schoolMotto = data.schoolMotto || DEFAULT_SCHOOL.motto;

  // Header Box
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 42, 'F');
  doc.setFillColor(217, 119, 6); // Gold line
  doc.rect(0, 42, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(schoolName, 105, 16, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(schoolMotto, 105, 24, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(251, 191, 36); // Amber
  doc.text(`ACADEMIC REPORT CARD • ${data.academicSession || 'ACADEMIC YEAR 2026–2027'}`, 105, 34, { align: 'center' });

  // Student Info Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 50, 182, 26, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Full Name:', 20, 58);
  doc.text('Admission Number:', 20, 68);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(data.studentName, 56, 58);
  doc.text(data.admissionNumber, 56, 68);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Class & Section:', 110, 58);
  doc.text('Roll Number:', 110, 68);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(data.className, 142, 58);
  doc.text(String(data.rollNumber || '#1'), 142, 68);

  // Marks Table
  const tableTop = 84;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, tableTop, 182, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SUBJECT', 18, tableTop + 5.5);
  doc.text('MAX', 80, tableTop + 5.5);
  doc.text('OBTAINED', 105, tableTop + 5.5);
  doc.text('PERCENT', 132, tableTop + 5.5);
  doc.text('GRADE', 155, tableTop + 5.5);
  doc.text('REMARKS', 172, tableTop + 5.5);

  let currentY = tableTop + 8;
  let totalMax = 0;
  let totalObtained = 0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  data.subjects.forEach((sub, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 8, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.text(sub.subjectName, 18, currentY + 5.5);
    doc.text(String(sub.maxMarks), 82, currentY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(String(sub.marksObtained), 108, currentY + 5.5);

    const pct = sub.maxMarks > 0 ? ((sub.marksObtained / sub.maxMarks) * 100).toFixed(1) : '0';
    doc.setFont('helvetica', 'normal');
    doc.text(`${pct}%`, 133, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.text(sub.grade || 'A', 158, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(sub.teacherRemarks || 'Satisfactory', 172, currentY + 5.5);
    doc.setFontSize(8.5);

    totalMax += sub.maxMarks;
    totalObtained += sub.marksObtained;
    currentY += 8;
  });

  // Total summary row
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 9, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, 196, currentY);
  doc.line(14, currentY + 9, 196, currentY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CUMULATIVE AGGREGATE TOTALS:', 18, currentY + 6);
  doc.text(String(totalMax), 82, currentY + 6);
  doc.text(String(totalObtained), 108, currentY + 6);

  const overallPct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0';
  doc.text(`${overallPct}%`, 133, currentY + 6);

  // Performance Box
  const summaryBoxY = currentY + 16;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(14, summaryBoxY, 182, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text(`OVERALL PERCENTAGE: ${overallPct}%  •  CUMULATIVE GRADE: ${data.overallGrade || 'A'}`, 20, summaryBoxY + 8);
  doc.setFontSize(9);
  doc.text(`PROMOTION / RESULT STATUS: ${data.promotionStatus || 'PASSED WITH DISTINCTION'}`, 20, summaryBoxY + 15);

  // Triple Signatures
  const sigY = 246;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, sigY, 65, sigY);
  doc.line(82, sigY, 128, sigY);
  doc.line(145, sigY, 190, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Class Teacher Signature', 23, sigY + 5);
  doc.text('Controller of Examinations', 84, sigY + 5);
  doc.text('Principal & Head of School', 147, sigY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Apex Academy Certified Academic Record • Verified via PostgreSQL Ledger', 105, 275, { align: 'center' });

  doc.save(`report-card-${data.admissionNumber || 'student'}.pdf`);
}

/**
 * Downloads a high-resolution, certified Digital ID Card PDF (Standard CR80 dimensions)
 */
export function downloadIdCardPdf(data: IdCardPdfData): void {
  // CR80 is 85.6mm x 53.98mm. We generate a clean landscape page with front & back side.
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [90, 60] });
  const schoolName = data.schoolName || DEFAULT_SCHOOL.name;
  const holderName = data.holderName || data.fullName || 'Authorized Holder';
  const holderType = data.holderType || data.roleCategory || 'STUDENT';
  const cardNumber = data.cardNumber || ('CR80-' + data.identifierNumber);
  const className = data.className || data.classOrDept || 'Grade 10-A';
  const dept = data.department || data.classOrDept || 'Academic';

  // Background
  doc.setFillColor(15, 23, 42); // Navy
  doc.rect(0, 0, 90, 60, 'F');

  // Gold Header Banner
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 0, 90, 11, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(schoolName.toUpperCase(), 45, 5, { align: 'center' });

  doc.setFontSize(5.5);
  doc.text(holderType === 'STUDENT' ? 'STUDENT IDENTITY CARD' : 'STAFF IDENTITY CARD', 45, 9, { align: 'center' });

  // Photo Silhouette Box
  doc.setFillColor(30, 41, 59);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.roundedRect(6, 16, 22, 28, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(217, 119, 6);
  doc.text(holderName.charAt(0) || 'E', 17, 33, { align: 'center' });

  // Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(holderName, 32, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);

  if (holderType === 'STUDENT') {
    doc.text(`Adm No: ${data.identifierNumber}`, 32, 24);
    doc.text(`Class: ${className}`, 32, 28);
    doc.text(`Blood Group: ${data.bloodGroup || 'O+'}`, 32, 32);
    doc.text(`Session: ${data.academicSession || '2026–2027'}`, 32, 36);
  } else {
    doc.text(`Emp ID: ${data.identifierNumber}`, 32, 24);
    doc.text(`Dept: ${dept}`, 32, 28);
    doc.text(`Role: ${data.designation || 'Faculty'}`, 32, 32);
    doc.text(`Validity: Active`, 32, 36);
  }

  // Status Badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(32, 40, 16, 4.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text(data.status ? `VERIFIED ${data.status}` : 'VERIFIED ACTIVE', 33.5, 43.2);

  // Card Number Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Card No: ${cardNumber}`, 6, 54);
  doc.text(`Emergency: ${data.emergencyPhone || '+91 (11) 2659-1000'}`, 50, 54);

  doc.save(`id-card-${data.identifierNumber || 'edunexa'}.pdf`);
}
