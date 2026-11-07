import { jsPDF } from 'jspdf';

export interface IdCardRenderData {
  holderType: 'STUDENT' | 'TEACHER' | 'STAFF';
  fullName: string;
  identifier: string; // admissionNumber or employeeId
  subDetail: string; // "Grade 10-A" or "Mathematics • Senior Faculty"
  bloodGroup?: string | null;
  dateOfBirth?: string | null;
  joiningDate?: string | null;
  emergencyPhone?: string | null;
  address?: string | null;
  academicSession?: string | null;
  avatarUrl?: string | null;
  cardNumber: string;
  verificationToken: string;
  status: string;
  schoolName?: string;
  schoolCode?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
}

export interface IdCardTemplateSettings {
  primaryColor?: string; // Header & accent
  secondaryColor?: string; // Gold or sub-accent
  headerTextColor?: string;
  cardOrientation?: 'LANDSCAPE' | 'PORTRAIT';
  showBloodGroup?: boolean;
  showParentContact?: boolean;
  showEmergencyPhone?: boolean;
  showPrincipalSign?: boolean;
  showSchoolSeal?: boolean;
  customTermsText?: string | null;
}

/**
 * Render Front Side of a single CR80 card at (x, y) coordinates on a jsPDF doc.
 * Standard CR80 dimensions: 85.6 mm width x 53.98 mm height.
 */
export function drawCardFront(
  doc: jsPDF,
  x: number,
  y: number,
  data: IdCardRenderData,
  template: IdCardTemplateSettings = {}
) {
  const w = 85.6;
  const h = 53.98;
  const primaryColor = template.primaryColor || '#1e3a8a';
  const secondaryColor = template.secondaryColor || '#d97706';
  const schoolName = (data.schoolName || 'Apex Academy of Excellence').toUpperCase();
  const isStudent = data.holderType === 'STUDENT';

  // Card Outer Rounded Box & Shadow
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Header Banner
  doc.setFillColor(primaryColor);
  doc.roundedRect(x, y, w, 11, 2, 2, 'F');
  doc.rect(x, y + 8, w, 3, 'F'); // square bottom edges of header

  // Gold accent line under header
  doc.setFillColor(secondaryColor);
  doc.rect(x, y + 11, w, 0.8, 'F');

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(schoolName, x + w / 2, y + 5.5, { align: 'center' });

  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  const roleSub = isStudent ? 'STUDENT IDENTITY CREDENTIAL' : `${data.holderType} IDENTITY CREDENTIAL`;
  doc.text(roleSub, x + w / 2, y + 9, { align: 'center' });

  // Photo Box (Left)
  const photoX = x + 5;
  const photoY = y + 14.5;
  const photoW = 20;
  const photoH = 26;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, 'FD');

  let imageDrawn = false;
  if (data.avatarUrl) {
    try {
      doc.addImage(data.avatarUrl, 'JPEG', photoX + 0.3, photoY + 0.3, photoW - 0.6, photoH - 0.6);
      imageDrawn = true;
    } catch {
      imageDrawn = false;
    }
  }

  if (!imageDrawn) {
    // Silhouette / Initials
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const initials = data.fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('');
    doc.text(initials || 'ID', photoX + photoW / 2, photoY + 14, { align: 'center' });

    doc.setFontSize(3.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('PHOTO PENDING', photoX + photoW / 2, photoY + 22, { align: 'center' });
  }

  // Right Side Data
  const textX = x + 28;
  let curY = y + 16.5;

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const truncatedName = doc.splitTextToSize(data.fullName, 54);
  doc.text(truncatedName[0] || data.fullName, textX, curY);
  curY += 4.5;

  // Key / SubDetail
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(primaryColor);
  doc.text(data.subDetail, textX, curY);
  curY += 4;

  // Grid details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);

  const idLabel = isStudent ? 'Admission No:' : 'Employee ID:';
  doc.text(`${idLabel} ${data.identifier}`, textX, curY);
  curY += 3.5;

  if (isStudent) {
    if (template.showBloodGroup !== false && data.bloodGroup) {
      doc.text(`Blood Group: ${data.bloodGroup}`, textX, curY);
      curY += 3.5;
    }
    doc.text(`Academic Session: ${data.academicSession || '2026–2027'}`, textX, curY);
    curY += 3.5;
  } else {
    if (data.joiningDate) {
      doc.text(`Joining Date: ${data.joiningDate}`, textX, curY);
      curY += 3.5;
    }
    doc.text(`Employment: Active Permanent`, textX, curY);
    curY += 3.5;
  }

  // Status Badge Pill
  const isActive = data.status === 'ACTIVE';
  doc.setFillColor(isActive ? 220 : 254, isActive ? 252 : 226, isActive ? 231 : 226);
  doc.roundedRect(textX, curY, 24, 4, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(isActive ? 22 : 185, isActive ? 101 : 28, isActive ? 52 : 28);
  doc.text(isActive ? '● VERIFIED ACTIVE' : `● ${data.status}`, textX + 12, curY + 2.8, { align: 'center' });

  // QR Block (Bottom Right)
  const qrX = x + w - 17;
  const qrY = y + h - 17;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(248, 250, 252);
  doc.rect(qrX, qrY, 13, 13, 'FD');

  // Simulated QR graphic pattern
  doc.setFillColor(15, 23, 42);
  doc.rect(qrX + 1.5, qrY + 1.5, 3.5, 3.5, 'F');
  doc.rect(qrX + 8, qrY + 1.5, 3.5, 3.5, 'F');
  doc.rect(qrX + 1.5, qrY + 8, 3.5, 3.5, 'F');
  doc.rect(qrX + 6, qrY + 6, 2, 2, 'F');
  doc.rect(qrX + 9, qrY + 9, 2.5, 2.5, 'F');

  // Footer Serial / Card Number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`CARD NO: ${data.cardNumber}`, x + 5, y + h - 2.5);
  doc.text(`SCAN QR TO VERIFY CREDENTIAL`, qrX - 1, y + h - 2.5, { align: 'right' });
}

/**
 * Render Back Side of a single CR80 card at (x, y) coordinates on a jsPDF doc.
 */
export function drawCardBack(
  doc: jsPDF,
  x: number,
  y: number,
  data: IdCardRenderData,
  template: IdCardTemplateSettings = {}
) {
  const w = 85.6;
  const h = 53.98;
  const primaryColor = template.primaryColor || '#1e3a8a';
  const schoolName = data.schoolName || 'Apex Academy of Excellence';
  const schoolAddress = data.schoolAddress || 'Plot 42, Knowledge Park III, Silicon Valley, Bengaluru 560100';
  const schoolPhone = data.schoolPhone || '+91 80 4968 2000';
  const schoolEmail = data.schoolEmail || 'office@apexacademy.edu';
  const isStudent = data.holderType === 'STUDENT';

  // Card Outer Rounded Box
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Top Accent Strip
  doc.setFillColor(primaryColor);
  doc.rect(x, y, w, 2.5, 'F');

  let curY = y + 6;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(primaryColor);
  doc.text('INSTITUTIONAL CONTACT & VERIFICATION RECORD', x + w / 2, curY, { align: 'center' });
  curY += 4;

  // Contact Grid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Campus: ${schoolAddress}`, x + 5, curY);
  curY += 3;
  doc.text(`Telephone: ${schoolPhone} | Email: ${schoolEmail}`, x + 5, curY);
  curY += 3.5;

  // Emergency / Parent Line
  if (template.showEmergencyPhone !== false && data.emergencyPhone) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28); // Alert red
    const phoneLabel = isStudent ? 'Parent / Emergency Contact:' : 'Emergency Contact:';
    doc.text(`${phoneLabel} ${data.emergencyPhone}`, x + 5, curY);
    curY += 3.5;
  }

  if (isStudent && data.dateOfBirth) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Date of Birth: ${data.dateOfBirth}`, x + 5, curY);
    curY += 3.5;
  }

  // Terms and Conditions text
  const terms =
    template.customTermsText ||
    'This credential is non-transferable and remains institutional property. If found, return to school office or call security helpline. Verification: apexacademy.edu/verify-id';
  doc.setFontSize(4);
  doc.setTextColor(100, 116, 139);
  const splitTerms = doc.splitTextToSize(terms, w - 10);
  doc.text(splitTerms, x + 5, curY);
  curY += splitTerms.length * 2.2 + 2;

  // Signatures Area
  const sigY = y + h - 11;

  // Seal placeholder box
  if (template.showSchoolSeal !== false) {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(x + 8, sigY - 1, 14, 8, 1, 1);
    doc.setFontSize(3.8);
    doc.setTextColor(148, 163, 184);
    doc.text('OFFICIAL SEAL', x + 15, sigY + 3.5, { align: 'center' });
  }

  // Principal Signature Line
  if (template.showPrincipalSign !== false) {
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.line(x + w - 32, sigY + 4, x + w - 6, sigY + 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Principal / Authorized Signatory', x + w - 19, sigY + 7, { align: 'center' });
  }

  // Bottom token
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Token: ${data.verificationToken}`, x + w / 2, y + h - 1.5, { align: 'center' });
}

/**
 * Generate Individual High-Resolution CR80 ID Card PDF (Page 1 Front, Page 2 Back).
 */
export function generateIndividualIdCardPdf(
  data: IdCardRenderData,
  template: IdCardTemplateSettings = {}
): jsPDF {
  // 90mm x 60mm page accommodates 85.6mm x 53.98mm CR80 card with centered margins
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [90, 60],
  });

  const marginX = (90 - 85.6) / 2;
  const marginY = (60 - 53.98) / 2;

  // Page 1: Front
  drawCardFront(doc, marginX, marginY, data, template);

  // Page 2: Back
  doc.addPage([90, 60], 'landscape');
  drawCardBack(doc, marginX, marginY, data, template);

  return doc;
}

/**
 * Helper to convert an image URL (relative or absolute) to base64 Data URL
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
 * Download Individual ID Card PDF with embedded photograph.
 */
export async function downloadIndividualIdCardPdf(
  data: IdCardRenderData,
  template: IdCardTemplateSettings = {},
  fileName?: string
): Promise<void> {
  const cloned = { ...data };
  if (cloned.avatarUrl && !cloned.avatarUrl.startsWith('data:image')) {
    const b64 = await resolveImageBase64(cloned.avatarUrl);
    if (b64) cloned.avatarUrl = b64;
  }
  const doc = generateIndividualIdCardPdf(cloned, template);
  const cleanId = (cloned.identifier || 'id-card').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  doc.save(fileName || `id-card-${cleanId}.pdf`);
}

/**
 * Generate Print-Ready Bulk ID Cards PDF on Standard A4 Sheets.
 * Layout: 8 Cards per A4 Sheet (2 columns x 4 rows).
 * Page N: Front sides of cards 1..8
 * Page N+1: Matching Back sides of cards 1..8 (mirrored horizontally for 2-sided duplex printing).
 */
export function generateBulkIdCardsPdf(
  cards: IdCardRenderData[],
  template: IdCardTemplateSettings = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const cardW = 85.6;
  const cardH = 53.98;

  const colGap = 8;
  const rowGap = 7;
  const totalGridW = cardW * 2 + colGap; // 179.2 mm
  const totalGridH = cardH * 4 + rowGap * 3; // 236.92 mm
  const startX = (pageWidth - totalGridW) / 2; // ~15.4 mm
  const startY = (pageHeight - totalGridH) / 2; // ~30 mm

  const CARDS_PER_PAGE = 8;
  const totalBatches = Math.ceil(cards.length / CARDS_PER_PAGE);

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batchCards = cards.slice(batchIdx * CARDS_PER_PAGE, (batchIdx + 1) * CARDS_PER_PAGE);

    if (batchIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    // FRONT SIDES PAGE
    // Top print header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `EduNexa Batch Printing — Sheet ${batchIdx + 1} of ${totalBatches} (Front Sides)`,
      pageWidth / 2,
      startY - 5,
      { align: 'center' }
    );

    batchCards.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const posX = startX + col * (cardW + colGap);
      const posY = startY + row * (cardH + rowGap);
      drawCardFront(doc, posX, posY, c, template);
    });

    // BACK SIDES PAGE (Duplex Mirrored)
    doc.addPage('a4', 'portrait');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `EduNexa Batch Printing — Sheet ${batchIdx + 1} of ${totalBatches} (Back Sides - Duplex Mirrored)`,
      pageWidth / 2,
      startY - 5,
      { align: 'center' }
    );

    batchCards.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      // For horizontal duplex alignment on flip, col 0 matches col 1 on reverse side
      const mirroredCol = col === 0 ? 1 : 0;
      const posX = startX + mirroredCol * (cardW + colGap);
      const posY = startY + row * (cardH + rowGap);
      drawCardBack(doc, posX, posY, c, template);
    });
  }

  return doc;
}

/**
 * Download Bulk ID Cards PDF with resolved photos.
 */
export async function downloadBulkIdCardsPdf(
  cards: IdCardRenderData[],
  template: IdCardTemplateSettings = {},
  fileName = 'edunexa-id-cards-batch.pdf'
): Promise<void> {
  const resolvedCards = await Promise.all(
    cards.map(async (c) => {
      const cloned = { ...c };
      if (cloned.avatarUrl && !cloned.avatarUrl.startsWith('data:image')) {
        const b64 = await resolveImageBase64(cloned.avatarUrl);
        if (b64) cloned.avatarUrl = b64;
      }
      return cloned;
    })
  );
  const doc = generateBulkIdCardsPdf(resolvedCards, template);
  doc.save(fileName);
}
