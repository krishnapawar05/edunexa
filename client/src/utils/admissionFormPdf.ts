import { jsPDF } from 'jspdf';

export interface AdmissionPdfOptions {
  schoolName?: string;
  schoolCode?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  academicSession?: string;
  affiliationNumber?: string;
  requiredDocuments?: Array<{ type: string; label: string; isRequired: boolean }>;
}

/**
 * Generate official school-branded A4 printable Admission Application Form.
 */
export function generateAdmissionFormPdf(options: AdmissionPdfOptions = {}): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const schoolName = (options.schoolName || 'Apex Academy of Excellence').toUpperCase();
  const schoolCode = options.schoolCode || 'APEX-EDU';
  const schoolAddress =
    options.schoolAddress || 'Plot 42, Knowledge Park III, Silicon Valley, Bengaluru 560100';
  const schoolPhone = options.schoolPhone || '+91 80 4968 2000';
  const schoolEmail = options.schoolEmail || 'admissions@apexacademy.edu';
  const session = options.academicSession || '2026–2027';
  const affiliation = options.affiliationNumber || 'CBSE Affiliation No: 1930482 / School Code: 40291';

  // Outer decorative border
  doc.setDrawColor(30, 58, 138); // Deep Navy
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  // Inner thin border
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.3);
  doc.rect(margin + 1.5, margin + 1.5, contentWidth - 3, pageHeight - margin * 2 - 3);

  // Header Background Accent
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, 30, 'F');

  // Header Title
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(schoolName, pageWidth / 2, margin + 9, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(affiliation, pageWidth / 2, margin + 14, { align: 'center' });
  doc.text(`${schoolAddress} | Ph: ${schoolPhone} | Email: ${schoolEmail}`, pageWidth / 2, margin + 19, {
    align: 'center',
  });

  // Form Banner
  doc.setFillColor(30, 58, 138);
  doc.rect(margin + 2, margin + 24, contentWidth - 4, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`OFFICIAL ADMISSION APPLICATION FORM — ACADEMIC SESSION ${session}`, pageWidth / 2, margin + 28.5, {
    align: 'center',
  });

  // Photo Box (Top Right)
  const photoW = 32;
  const photoH = 40;
  const photoX = pageWidth - margin - photoW - 5;
  const photoY = margin + 34;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.rect(photoX, photoY, photoW, photoH);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('AFFIX RECENT', photoX + photoW / 2, photoY + 16, { align: 'center' });
  doc.text('PASSPORT PHOTO', photoX + photoW / 2, photoY + 20, { align: 'center' });
  doc.text('(3.5 cm x 4.5 cm)', photoX + photoW / 2, photoY + 24, { align: 'center' });
  doc.text('Self-Attested', photoX + photoW / 2, photoY + 28, { align: 'center' });

  // Serial / Reference Line
  let curY = margin + 37;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Form Reference No:  ADM-${session.slice(0, 4)}-_______________`, margin + 5, curY);
  curY += 6;
  doc.text(`Date of Submission:  _____ / _____ / 2026`, margin + 5, curY);
  curY += 6;
  doc.text(`Class Applied For:     _________________________________`, margin + 5, curY);
  curY += 6;
  doc.text(`Stream (if Gr 11):     [ ] Science   [ ] Commerce   [ ] Humanities`, margin + 5, curY);

  curY = photoY + photoH + 5;

  // Section Banner Helper
  const drawSection = (title: string, y: number) => {
    doc.setFillColor(224, 231, 255);
    doc.rect(margin + 3, y, contentWidth - 6, 5.5, 'F');
    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(title, margin + 6, y + 4);
    return y + 7.5;
  };

  // Field Line Helper
  const drawFieldLine = (label: string, y: number, length: number = 80, x: number = margin + 5) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(label, x, y);
    const textWidth = doc.getTextWidth(label);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.line(x + textWidth + 2, y + 0.5, x + textWidth + 2 + length, y + 0.5);
  };

  // SECTION 1: CANDIDATE PARTICULARS
  curY = drawSection('1. CANDIDATE PARTICULARS (FILL IN BLOCK LETTERS)', curY);

  drawFieldLine("Full Name of Student:", curY, 130);
  curY += 6;
  drawFieldLine("Date of Birth (DD/MM/YYYY):", curY, 35);
  doc.text("Gender:  [ ] Male   [ ] Female   [ ] Other", margin + 75, curY);
  doc.text("Blood Group: _______", margin + 140, curY);
  curY += 6;
  drawFieldLine("Aadhaar / National ID No:", curY, 50);
  drawFieldLine("Nationality:", curY, 40, margin + 95);
  curY += 6;
  drawFieldLine("Residential Address:", curY, 135);
  curY += 6;
  drawFieldLine("City / District:", curY, 45);
  drawFieldLine("State:", curY, 35, margin + 80);
  drawFieldLine("PIN Code: _________", curY, 20, margin + 140);
  curY += 8;

  // SECTION 2: PARENT & GUARDIAN DETAILS
  curY = drawSection('2. PARENT / GUARDIAN DETAILS', curY);

  drawFieldLine("Father's Name:", curY, 65);
  drawFieldLine("Occupation:", curY, 50, margin + 95);
  curY += 5.5;
  drawFieldLine("Father's Mobile No:", curY, 55);
  drawFieldLine("Father's Email:", curY, 55, margin + 95);
  curY += 5.5;
  drawFieldLine("Mother's Name:", curY, 65);
  drawFieldLine("Occupation:", curY, 50, margin + 95);
  curY += 5.5;
  drawFieldLine("Mother's Mobile No:", curY, 55);
  drawFieldLine("Mother's Email:", curY, 55, margin + 95);
  curY += 5.5;
  drawFieldLine("Local Guardian (if any):", curY, 55);
  drawFieldLine("Guardian Phone:", curY, 50, margin + 95);
  curY += 8;

  // SECTION 3: PREVIOUS ACADEMIC RECORD
  curY = drawSection('3. PREVIOUS ACADEMIC RECORD', curY);

  drawFieldLine("Name of Previous School:", curY, 125);
  curY += 5.5;
  drawFieldLine("Previous Class Passed:", curY, 30);
  drawFieldLine("Board / Affiliation:", curY, 35, margin + 65);
  drawFieldLine("Aggregate Marks % / Grade:", curY, 25, margin + 130);
  curY += 5.5;
  drawFieldLine("Medium of Instruction:", curY, 35);
  drawFieldLine("Transfer Certificate (TC) No:", curY, 45, margin + 75);
  curY += 8;

  // SECTION 4: DOCUMENT CHECKLIST
  curY = drawSection('4. ENCLOSURE CHECKLIST (ATTACH SELF-ATTESTED COPIES)', curY);

  const docs = options.requiredDocuments || [
    { type: '1', label: 'Birth Certificate issued by Registrar / Municipal Authority', isRequired: true },
    { type: '2', label: 'Previous Academic Progress Report / Marksheet', isRequired: true },
    { type: '3', label: 'Transfer Certificate (TC) counter-signed by competent authority', isRequired: false },
    { type: '4', label: 'Aadhaar Card / Government Identity Proof of Student & Parent', isRequired: true },
    { type: '5', label: 'Passport Size Photographs (4 recent identical copies)', isRequired: true },
  ];

  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  docs.slice(0, 5).forEach((d) => {
    const reqBadge = d.isRequired ? '(Mandatory)' : '(Optional at Application)';
    doc.text(`[  ]  ${d.label}  ${reqBadge}`, margin + 6, curY);
    curY += 4.5;
  });
  curY += 2;

  // SECTION 5: DECLARATION & CODE OF CONDUCT
  curY = drawSection('5. DECLARATION BY PARENT / GUARDIAN', curY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const declarationText =
    "I hereby declare that all particulars stated in this application are true, complete, and authentic to the best of my knowledge. I understand that false or misleading information will result in immediate disqualification or cancellation of admission. I agree to abide by all the rules, codes of conduct, fee payment schedules, and academic regulations of the institution currently in force or amended from time to time.";
  const splitDeclaration = doc.splitTextToSize(declarationText, contentWidth - 10);
  doc.text(splitDeclaration, margin + 5, curY);

  curY += splitDeclaration.length * 3.5 + 10;

  // Signatures
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);

  // Parent Signature Line
  doc.line(margin + 10, curY, margin + 65, curY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Signature of Father / Guardian', margin + 15, curY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Date: ______________', margin + 15, curY + 7.5);

  // Mother Signature Line
  doc.line(margin + 75, curY, margin + 125, curY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature of Mother', margin + 83, curY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Date: ______________', margin + 83, curY + 7.5);

  // Seal / Office Line
  doc.line(margin + 135, curY, margin + 178, curY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Admissions In-charge / Principal', margin + 136, curY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('(Official Seal & Verification)', margin + 140, curY + 7.5);

  // Footer Note
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `EduNexa Integrated ERP System • Generated for ${schoolName} (${schoolCode}) • Verification Portal: https://apexacademy.edu/admissions`,
    pageWidth / 2,
    pageHeight - margin - 2.5,
    { align: 'center' }
  );

  return doc;
}

/**
 * Trigger immediate client-side download of the official admission application form.
 */
export function downloadAdmissionFormPdf(options: AdmissionPdfOptions = {}): void {
  const doc = generateAdmissionFormPdf(options);
  const code = (options.schoolCode || 'edunexa').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const session = (options.academicSession || '2026-2027').replace(/[^0-9-]/g, '');
  doc.save(`admission-application-form-${code}-${session}.pdf`);
}

