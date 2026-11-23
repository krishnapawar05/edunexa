import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
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
  logoUrl?: string | null;
  studentPhotoUrl?: string | null;
  logoDataUrl?: string | null;
  studentPhotoDataUrl?: string | null;
  qrDataUrl?: string | null;
  timetable: AdmitCardTimetableEntry[];
}

/**
 * Helper to convert an image URL (relative or absolute) to a base64 Data URL
 * to ensure jsPDF can embed it seamlessly without canvas tainting.
 */
export async function resolveImageBase64(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Pre-processes AdmitCardPdfData by resolving remote/relative photos,
 * logos, and generating a genuine high-resolution scannable QR code.
 */
export async function prepareAdmitCardPdfData(data: AdmitCardPdfData): Promise<AdmitCardPdfData> {
  const cloned: AdmitCardPdfData = { ...data };

  // 1. Resolve school logo if provided
  if (cloned.logoUrl && !cloned.logoDataUrl) {
    if (cloned.logoUrl.startsWith('data:image')) {
      cloned.logoDataUrl = cloned.logoUrl;
    } else {
      const b64 = await resolveImageBase64(cloned.logoUrl);
      if (b64) cloned.logoDataUrl = b64;
    }
  }

  // 2. Resolve student photograph if provided
  if (cloned.studentPhotoUrl && !cloned.studentPhotoDataUrl) {
    if (cloned.studentPhotoUrl.startsWith('data:image')) {
      cloned.studentPhotoDataUrl = cloned.studentPhotoUrl;
    } else {
      const b64 = await resolveImageBase64(cloned.studentPhotoUrl);
      if (b64) cloned.studentPhotoDataUrl = b64;
    }
  }

  // 3. Generate genuine scannable verification QR code
  if (!cloned.qrDataUrl && cloned.qrToken) {
    try {
      const verificationUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/verify-admit-card/${encodeURIComponent(cloned.qrToken)}`
          : `https://edunexa.up.railway.app/verify-admit-card/${encodeURIComponent(cloned.qrToken)}`;
      cloned.qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 300,
        margin: 1,
        color: { dark: '#0f291e', light: '#ffffff' },
      });
    } catch {
      // fallback
    }
  }

  return cloned;
}

/**
 * Draw an authentic, subtle institutional watermark in the center of the page.
 */
function drawWatermark(doc: jsPDF, data: AdmitCardPdfData): void {
  const pageWidth = 210;
  const pageHeight = 297;
  const cx = pageWidth / 2; // 105 mm
  const cy = pageHeight / 2 - 2; // ~146.5 mm

  // If a school logo image is available, draw subtle watermark image behind
  if (data.logoDataUrl) {
    try {
      doc.saveGraphicsState();
      if ((doc as any).setGState && (doc as any).GState) {
        (doc as any).setGState(new (doc as any).GState({ opacity: 0.06 }));
      }
      const logoW = 75;
      const logoH = 75;
      doc.addImage(
        data.logoDataUrl,
        'PNG',
        cx - logoW / 2,
        cy - logoH / 2,
        logoW,
        logoH,
        undefined,
        'FAST'
      );
      doc.restoreGraphicsState();
    } catch {
      // Ignore if GState/image not supported
    }
  }

  // Draw authentic institutional watermark crest in faint vector lines
  // Faint gray-sage watermark color: rgb(234, 240, 245)
  doc.setDrawColor(234, 240, 245);

  // 1. Concentric security circles
  doc.setLineWidth(0.8);
  doc.circle(cx, cy, 48, 'S'); // Outer circle (diameter 96mm)

  doc.setLineWidth(0.3);
  doc.circle(cx, cy, 46, 'S');
  doc.circle(cx, cy, 33, 'S');
  doc.circle(cx, cy, 31.5, 'S');

  // 2. Watermark decorative stars / ticks around ring
  doc.setFillColor(234, 240, 245);
  for (let angle = 0; angle < 360; angle += 30) {
    const rad = (angle * Math.PI) / 180;
    const dotX = cx + 47 * Math.cos(rad);
    const dotY = cy + 47 * Math.sin(rad);
    doc.circle(dotX, dotY, 0.4, 'F');
  }

  // 3. Arched / Perimeter Watermark Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 228, 236);
  const schoolUpper = (data.schoolName || 'APEX ACADEMY OF SCIENCES & ARTS').toUpperCase();
  doc.text(schoolUpper, cx, cy - 38, { align: 'center' });

  doc.setFontSize(6.5);
  doc.text('OFFICIAL EXAMINATION HALL TICKET', cx, cy + 39, { align: 'center' });
  doc.text('• VERITAS ET EXCELLENTIA •', cx, cy + 42.5, { align: 'center' });

  // 4. Center Heraldic Shield & Academic Emblem
  doc.setDrawColor(230, 236, 242);
  doc.setLineWidth(0.5);

  const sW = 15;
  const sTop = cy - 18;
  const sMid = cy + 2;
  const sTip = cy + 16;

  // Draw shield outline
  doc.line(cx - sW, sTop, cx + sW, sTop); // Top edge
  doc.line(cx - sW, sTop, cx - sW, sMid); // Left side
  doc.line(cx + sW, sTop, cx + sW, sMid); // Right side
  doc.line(cx - sW, sMid, cx, sTip); // Bottom left to tip
  doc.line(cx + sW, sMid, cx, sTip); // Bottom right to tip

  // Shield inner line
  doc.setLineWidth(0.25);
  doc.line(cx - sW + 2, sTop + 2, cx + sW - 2, sTop + 2);
  doc.line(cx - sW + 2, sTop + 2, cx - sW + 2, sMid);
  doc.line(cx + sW - 2, sTop + 2, cx + sW - 2, sMid);
  doc.line(cx - sW + 2, sMid, cx, sTip - 2.5);
  doc.line(cx + sW - 2, sMid, cx, sTip - 2.5);

  // Open Book of Knowledge in Center of Shield
  const bookY = cy - 5;
  doc.setLineWidth(0.4);
  // Left page
  doc.line(cx - 7, bookY - 3, cx, bookY - 1);
  doc.line(cx - 7, bookY + 3, cx, bookY + 5);
  doc.line(cx - 7, bookY - 3, cx - 7, bookY + 3);
  doc.line(cx, bookY - 1, cx, bookY + 5);
  // Right page
  doc.line(cx, bookY - 1, cx + 7, bookY - 3);
  doc.line(cx, bookY + 5, cx + 7, bookY + 3);
  doc.line(cx + 7, bookY - 3, cx + 7, bookY + 3);

  // Torch of Knowledge / Star Above Book
  doc.circle(cx, cy - 11, 2, 'S');
  doc.line(cx, cy - 14, cx, cy - 8);
  doc.line(cx - 3, cy - 11, cx + 3, cy - 11);

  // Banner ribbon under shield
  doc.line(cx - 16, cy + 22, cx + 16, cy + 22);
  doc.setFontSize(6);
  doc.setTextColor(222, 230, 238);
  doc.text('AUTHENTIC CREDENTIAL', cx, cy + 25, { align: 'center' });
}

/**
 * Draw a single full-page official A4 examination admit card on the specified jsPDF doc.
 */
export function drawAdmitCardOnDoc(doc: jsPDF, data: AdmitCardPdfData): void {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186 mm

  const schoolName = (data.schoolName || 'Apex Academy of Sciences & Arts').toUpperCase();
  const schoolCode = data.schoolCode || 'APX-01';
  const schoolAddress = data.schoolAddress || 'Sector 14, Institutional Area, New Delhi, India 110025';
  const schoolPhone = data.schoolPhone || '+91 (11) 2840-9100';
  const schoolEmail = data.schoolEmail || 'admissions@apexacademy.edu';
  const session = data.sessionName || 'Academic Year 2026–2027';
  const examTitle = (data.examTitle || 'Annual Examination 2026–2027').toUpperCase();

  // 1. Double Institutional Security Border
  doc.setDrawColor(15, 41, 30); // Forest Navy / Green
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  doc.setDrawColor(197, 155, 39); // Academic Gold Accent
  doc.setLineWidth(0.3);
  doc.rect(margin + 1.5, margin + 1.5, contentWidth - 3, pageHeight - margin * 2 - 3);

  // 2. Institutional Background Watermark (Rendered early so foreground is 100% legible)
  drawWatermark(doc, data);

  // 3. Header Banner Background
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, 30, 'F');

  // School Logo / Crest Box (Top Left)
  const logoBoxX = margin + 5;
  const logoBoxY = margin + 5;
  const logoBoxSize = 22;

  if (data.logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 2, 2, 'FD');
      doc.setDrawColor(197, 155, 39);
      doc.setLineWidth(0.4);
      doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 2, 2, 'D');

      doc.addImage(
        data.logoDataUrl,
        'PNG',
        logoBoxX + 1,
        logoBoxY + 1,
        logoBoxSize - 2,
        logoBoxSize - 2,
        undefined,
        'FAST'
      );
    } catch {
      drawCrestFallback();
    }
  } else {
    drawCrestFallback();
  }

  function drawCrestFallback() {
    doc.setFillColor(15, 41, 30); // Deep Forest Green
    doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 3, 3, 'F');

    // Gold inner border
    doc.setDrawColor(197, 155, 39);
    doc.setLineWidth(0.4);
    doc.roundedRect(logoBoxX + 1, logoBoxY + 1, logoBoxSize - 2, logoBoxSize - 2, 2, 2, 'D');

    // Monogram text
    const monogramText = data.schoolCode ? data.schoolCode.split('-')[0] : schoolName.charAt(0) || 'A';
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(monogramText.length > 2 ? 10 : 13);
    doc.text(monogramText, logoBoxX + logoBoxSize / 2, logoBoxY + 13, { align: 'center' });

    // Under-monogram banner
    doc.setFillColor(197, 155, 39);
    doc.rect(logoBoxX + 2.5, logoBoxY + 16.5, logoBoxSize - 5, 2.5, 'F');
    doc.setFontSize(4.5);
    doc.setTextColor(15, 41, 30);
    doc.text('ESTD 1998', logoBoxX + logoBoxSize / 2, logoBoxY + 18.3, { align: 'center' });
  }

  // School Title & Official Sub-Lines
  doc.setTextColor(15, 41, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  const truncatedSchool = doc.splitTextToSize(schoolName, contentWidth - 36);
  doc.text(truncatedSchool[0] || schoolName, margin + 30, margin + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(schoolAddress, margin + 30, margin + 16.8);
  doc.text(`Tel: ${schoolPhone}  •  Email: ${schoolEmail}`, margin + 30, margin + 21.2);
  doc.text(`Affiliation Code: ${schoolCode}  •  Continuous Evaluation & Examination Board`, margin + 30, margin + 25.5);

  // 4. Hall Ticket Badge Ribbon
  doc.setFillColor(15, 41, 30);
  doc.rect(margin + 2, margin + 32, contentWidth - 4, 10, 'F');

  // Gold accent lines on ribbon
  doc.setFillColor(197, 155, 39);
  doc.rect(margin + 2, margin + 32, contentWidth - 4, 0.6, 'F');
  doc.rect(margin + 2, margin + 41.4, contentWidth - 4, 0.6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`OFFICIAL EXAMINATION ADMIT CARD / HALL TICKET — ${session}`, pageWidth / 2, margin + 38.5, {
    align: 'center',
  });

  // 5. Candidate & Examination Details Grid
  let curY = margin + 45;

  // Candidate Photograph Container (Right Column)
  const photoW = 32;
  const photoH = 40;
  const photoX = margin + contentWidth - photoW - 4; // 12 + 186 - 32 - 4 = 162 mm
  const photoY = curY;

  // Photo border & background
  doc.setDrawColor(15, 41, 30);
  doc.setLineWidth(0.4);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, 'D');

  if (data.studentPhotoDataUrl) {
    try {
      doc.addImage(
        data.studentPhotoDataUrl,
        'JPEG',
        photoX + 0.5,
        photoY + 0.5,
        photoW - 1,
        photoH - 1,
        undefined,
        'FAST'
      );
    } catch {
      drawPhotoPlaceholder();
    }
  } else {
    drawPhotoPlaceholder();
  }

  function drawPhotoPlaceholder() {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(photoX + 0.4, photoY + 0.4, photoW - 0.8, photoH - 0.8, 1, 1, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(photoX + 2, photoY + 2, photoW - 4, photoH - 4, 1, 1, 'D');

    // Camera / User Silhouette
    doc.setFillColor(226, 232, 240);
    doc.circle(photoX + photoW / 2, photoY + 13, 4.5, 'F');
    doc.roundedRect(photoX + photoW / 2 - 7, photoY + 19, 14, 6, 2, 2, 'F');

    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('AFFIX RECENT', photoX + photoW / 2, photoY + 29.5, { align: 'center' });
    doc.text('PASSPORT PHOTO', photoX + photoW / 2, photoY + 33, { align: 'center' });
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('(35mm x 45mm)', photoX + photoW / 2, photoY + 36.5, { align: 'center' });
  }

  // Candidate Details Box (Left Column, exactly 142mm wide x 40mm high)
  const gridX = margin + 4; // 16 mm
  const gridW = photoX - gridX - 4; // 162 - 16 - 4 = 142 mm
  const gridH = 40; // matches photoH
  const rowH = gridH / 4; // 10 mm per row
  const col1W = 71;
  const col2W = 71;

  // Outer Grid Container
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(gridX, curY, gridW, gridH, 1, 1, 'FD');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(gridX, curY, gridW, gridH, 1, 1, 'D');

  // Vertical separator line between Column 1 and Column 2 (Strict separation)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(gridX + col1W, curY, gridX + col1W, curY + gridH);

  const candidateRows = [
    {
      c1Label: 'Candidate Name:',
      c1Val: (data.studentName || '—').toUpperCase(),
      c2Label: 'Admission No:',
      c2Val: data.admissionNumber || '—',
    },
    {
      c1Label: 'Roll Number:',
      c1Val: data.rollNumber || '—',
      c2Label: 'Class & Sec:',
      c2Val: `${data.className} - ${data.sectionName}`,
    },
    {
      c1Label: 'Examination:',
      c1Val: examTitle,
      c2Label: 'Admit Card No:',
      c2Val: data.admitCardNumber || '—',
    },
    {
      c1Label: 'Exam Center:',
      c1Val: data.centerName || 'Main Campus Examination Hall',
      c2Label: 'Room / Hall:',
      c2Val: data.roomNumber || 'Hall A',
    },
  ];

  candidateRows.forEach((row, idx) => {
    const rowY = curY + idx * rowH;

    // Alternating row background for crisp contrast
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(gridX + 0.2, rowY + 0.2, gridW - 0.4, rowH - 0.2, 'F');
    }

    // Horizontal divider
    if (idx > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(gridX, rowY, gridX + gridW, rowY);
    }

    // --- Column 1 (Left Half) ---
    const c1LabelX = gridX + 3;
    const c1ValX = gridX + 27;
    const c1MaxValW = 41; // Strict width stops before divider at 71mm

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(row.c1Label, c1LabelX, rowY + 6.2);

    doc.setTextColor(15, 23, 42);
    const c1Lines = doc.splitTextToSize(row.c1Val, c1MaxValW);
    if (c1Lines.length > 1) {
      doc.text(c1Lines[0], c1ValX, rowY + 4.2);
      doc.text(c1Lines[1], c1ValX, rowY + 7.8);
    } else {
      doc.text(c1Lines[0] || '', c1ValX, rowY + 6.2);
    }

    // --- Column 2 (Right Half) ---
    const c2LabelX = gridX + col1W + 3;
    const c2ValX = gridX + col1W + 27;
    const c2MaxValW = 41; // Strict width stops before right edge

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(row.c2Label, c2LabelX, rowY + 6.2);

    doc.setTextColor(15, 23, 42);
    const c2Lines = doc.splitTextToSize(row.c2Val, c2MaxValW);
    if (c2Lines.length > 1) {
      doc.text(c2Lines[0], c2ValX, rowY + 4.2);
      doc.text(c2Lines[1], c2ValX, rowY + 7.8);
    } else {
      doc.text(c2Lines[0] || '', c2ValX, rowY + 6.2);
    }
  });

  curY += gridH + 6;

  // 6. Subject Timetable Section Header
  const tableW = contentWidth - 8; // 178 mm
  doc.setFillColor(15, 41, 30);
  doc.rect(margin + 4, curY, tableW, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text('SUBJECT-WISE EXAMINATION TIMETABLE & INVIGILATOR VERIFICATION', margin + 8, curY + 4.6);

  curY += 6.5;

  // Table Headers (Exactly 178mm Total Width)
  const headers = [
    { label: '#', w: 10, align: 'center' as const },
    { label: 'Subject Name & Code', w: 60, align: 'left' as const },
    { label: 'Date', w: 25, align: 'center' as const },
    { label: 'Day', w: 22, align: 'center' as const },
    { label: 'Timing', w: 26, align: 'center' as const },
    { label: 'Room / Hall', w: 17, align: 'center' as const },
    { label: 'Invigilator Sign', w: 18, align: 'center' as const },
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 4, curY, tableW, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin + 4, curY, tableW, 6);
  doc.setTextColor(15, 41, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);

  let curX = margin + 4;
  headers.forEach((h) => {
    const textX = h.align === 'center' ? curX + h.w / 2 : curX + 3;
    doc.text(h.label, textX, curY + 4.2, { align: h.align });
    curX += h.w;
  });

  curY += 6;

  // Timetable Rows
  const rows = data.timetable && data.timetable.length > 0 ? data.timetable : [];
  if (rows.length === 0) {
    rows.push({
      subjectName: 'General Comprehensive Assessment',
      subjectCode: 'GEN-101',
      examDate: '2026-11-15',
      dayOfWeek: 'Monday',
      startTime: '09:30',
      endTime: '12:30',
      durationMinutes: 180,
      roomNumber: data.roomNumber || 'Hall-101',
      maxMarks: 100,
    });
  }

  rows.forEach((item, idx) => {
    const rowH = 8.5;
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin + 4, curY, tableW, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin + 4, curY, tableW, rowH);

    let cellX = margin + 4;

    // 1. Index
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(String(idx + 1), cellX + headers[0].w / 2, curY + 5.5, { align: 'center' });
    cellX += headers[0].w;

    // 2. Subject Name & Code (Width 60mm)
    const subjectMaxW = 56;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);

    const subjectFullName = item.subjectName || 'General Assessment';
    const subjectCodeStr = item.subjectCode ? `(${item.subjectCode})` : '';

    const combinedStr = `${subjectFullName} ${subjectCodeStr}`.trim();
    const splitLines = doc.splitTextToSize(combinedStr, subjectMaxW);
    if (splitLines.length > 1) {
      doc.text(splitLines[0], cellX + 3, curY + 3.8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(71, 85, 105);
      doc.text(splitLines[1], cellX + 3, curY + 7.2);
    } else {
      doc.text(splitLines[0], cellX + 3, curY + 5.5);
    }
    cellX += headers[1].w;

    // 3. Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(item.examDate, cellX + headers[2].w / 2, curY + 5.5, { align: 'center' });
    cellX += headers[2].w;

    // 4. Day
    doc.text(item.dayOfWeek, cellX + headers[3].w / 2, curY + 5.5, { align: 'center' });
    cellX += headers[3].w;

    // 5. Timing
    doc.text(`${item.startTime} - ${item.endTime}`, cellX + headers[4].w / 2, curY + 5.5, { align: 'center' });
    cellX += headers[4].w;

    // 6. Room
    doc.text(item.roomNumber || data.roomNumber || 'Hall A', cellX + headers[5].w / 2, curY + 5.5, { align: 'center' });
    cellX += headers[5].w;

    // 7. Signature Box
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(cellX + 2, curY + 2, headers[6].w - 4, rowH - 4);
    doc.setFontSize(5);
    doc.setTextColor(148, 163, 184);
    doc.text('SIGN', cellX + headers[6].w / 2, curY + 5.5, { align: 'center' });

    curY += rowH;
  });

  curY += 6;

  // 7. Instructions Box
  const instBoxH = 43;
  doc.setFillColor(254, 252, 232); // Amber light tint
  doc.rect(margin + 4, curY, tableW, instBoxH, 'F');
  doc.setDrawColor(254, 240, 138);
  doc.setLineWidth(0.3);
  doc.rect(margin + 4, curY, tableW, instBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(133, 77, 14); // Dark Amber
  doc.text('CRITICAL CANDIDATE INSTRUCTIONS & EXAMINATION CODE OF CONDUCT', margin + 8, curY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);

  const instructions = [
    '1. Reporting Time: Candidates must report to the allocated examination center at least 30 minutes before the scheduled start time.',
    '2. Mandatory Credentials: No candidate will be admitted into the examination hall without presenting this Admit Card and official Student ID badge.',
    '3. Prohibited Articles: Cellular phones, smartwatches, programmable calculators, bags, and unauthorized written materials are strictly banned inside the hall.',
    '4. Seating Protocol: Candidates must occupy their allotted seats as designated on the center display board and remain seated until answer sheets are collected.',
    '5. Disciplinary Rules: Any form of malpractice, communication with fellow candidates, or unauthorized movement will lead to immediate cancellation of candidature.',
    '6. Verification: The room invigilator must sign in the allocated column after verifying candidate identity and hall ticket barcode.',
  ];

  let instY = curY + 10.5;
  instructions.forEach((line) => {
    doc.text(line, margin + 8, instY);
    instY += 5.2;
  });

  curY += instBoxH + 6;

  // 8. Signatures Area
  const signColW = tableW / 3;
  const sigLineY = curY + 11;

  // Candidate Signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('__________________________________', margin + 4 + signColW * 0.1, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature of the Candidate', margin + 4 + signColW * 0.1, sigLineY + 4.5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('(To be signed in presence of Invigilator)', margin + 4 + signColW * 0.1, sigLineY + 8);

  // Invigilator Signature
  const col2X = margin + 4 + signColW;
  doc.text('__________________________________', col2X + signColW * 0.1, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Room Invigilator Verification', col2X + signColW * 0.1, sigLineY + 4.5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Verified Identity & Seating Allocation', col2X + signColW * 0.1, sigLineY + 8);

  // Controller / Principal Signature
  const col3X = margin + 4 + signColW * 2;
  doc.text('__________________________________', col3X + signColW * 0.1, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Principal & Controller of Examinations', col3X + signColW * 0.1, sigLineY + 4.5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${schoolName} Certified Digitally`, col3X + signColW * 0.1, sigLineY + 8);

  // 9. Bottom Security Verification Bar (Dynamic QR Code + Registry Info)
  const footerBoxY = pageHeight - margin - 20;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + 4, footerBoxY, tableW, 15, 1, 1, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 4, footerBoxY, tableW, 15, 1, 1, 'D');

  // Dynamic Scannable QR Code on Left
  const qrX = margin + 6;
  const qrY = footerBoxY + 1.2;
  const qrSize = 12.6;

  if (data.qrDataUrl) {
    try {
      doc.addImage(data.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');
    } catch {
      drawQrPlaceholder();
    }
  } else {
    drawQrPlaceholder();
  }

  function drawQrPlaceholder() {
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX, qrY, qrSize, qrSize, 'F');
    doc.setDrawColor(15, 41, 30);
    doc.setLineWidth(0.2);
    doc.rect(qrX, qrY, qrSize, qrSize, 'D');
    doc.setFontSize(4.5);
    doc.setTextColor(15, 41, 30);
    doc.text('VERIFY QR', qrX + qrSize / 2, qrY + qrSize / 2 + 1, { align: 'center' });
  }

  // Security Verification Text
  const textLeft = qrX + qrSize + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 41, 30);
  doc.text('EduNexa Examination Security & Cryptographic Registry System', textLeft, footerBoxY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  const token = data.qrToken || 'ac-tok-verified';
  doc.text(`Verification Token ID: ${token}`, textLeft, footerBoxY + 8.5);
  doc.text(
    `Official Hall Ticket • Status: ${data.status || 'PUBLISHED'} • Generated: ${new Date().toLocaleDateString()} • Strictly Confidential`,
    textLeft,
    footerBoxY + 12
  );

  // Security Seal Badge on the right
  const sealW = 28;
  const sealX = margin + 4 + tableW - sealW - 3;
  const sealY = footerBoxY + 2;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(sealX, sealY, sealW, 11, 1, 1, 'F');
  doc.setDrawColor(197, 155, 39);
  doc.setLineWidth(0.3);
  doc.roundedRect(sealX, sealY, sealW, 11, 1, 1, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(15, 41, 30);
  doc.text('TAMPER-EVIDENT', sealX + sealW / 2, sealY + 4.5, { align: 'center' });
  doc.setFontSize(4.2);
  doc.setTextColor(197, 155, 39);
  doc.text('OFFICIAL EXAM SEAL', sealX + sealW / 2, sealY + 8.5, { align: 'center' });
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
 * Download Individual Admit Card PDF with photo resolution and dynamic scannable QR code.
 */
export async function downloadIndividualAdmitCardPdf(
  data: AdmitCardPdfData,
  fileName?: string
): Promise<void> {
  const prepared = await prepareAdmitCardPdfData(data);
  const doc = generateIndividualAdmitCardPdf(prepared);
  const cleanAdmission = (prepared.admissionNumber || 'candidate').replace(/[^a-zA-Z0-9_-]/g, '');
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
 * Download Bulk Admit Cards PDF with photo resolution and dynamic scannable QR codes.
 */
export async function downloadBulkAdmitCardsPdf(
  cards: AdmitCardPdfData[],
  fileName = 'Admit-Cards-Batch.pdf'
): Promise<void> {
  const preparedCards = await Promise.all(cards.map((c) => prepareAdmitCardPdfData(c)));
  const doc = generateBulkAdmitCardsPdf(preparedCards);
  doc.save(fileName);
}
