import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

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
  qrDataUrl?: string | null;
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
  primaryColor?: string; // Header & accent (Default: #123c2e Forest Green)
  secondaryColor?: string; // Sub-accent (Default: #c59b27 Muted Gold)
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
  const primaryColor = template.primaryColor || '#123c2e'; // EduNexa Forest Green
  const secondaryColor = template.secondaryColor || '#c59b27'; // Institutional Muted Gold
  const schoolName = (data.schoolName || 'APEX ACADEMY OF SCIENCES & ARTS').toUpperCase();
  const isStudent = data.holderType === 'STUDENT';

  // Card Outer Rounded Box & Crisp Border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Header Banner (Deep Forest Green)
  doc.setFillColor(primaryColor);
  doc.roundedRect(x, y, w, 11, 2, 2, 'F');
  doc.rect(x, y + 8, w, 3, 'F'); // square bottom edges of header

  // Gold accent line under header
  doc.setFillColor(secondaryColor);
  doc.rect(x, y + 11, w, 0.8, 'F');

  // Header School Official Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(schoolName, x + w / 2, y + 5.5, { align: 'center' });

  // Subtitle (Credential Role & Session)
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  const roleSub = isStudent
    ? `OFFICIAL STUDENT IDENTITY CREDENTIAL • ${data.academicSession || '2026–2027'}`
    : `OFFICIAL FACULTY IDENTITY CREDENTIAL • ${data.academicSession || '2026–2027'}`;
  doc.text(roleSub, x + w / 2, y + 9, { align: 'center' });

  // Photo Box (Left) - Standard 3:4 Passport Aspect Ratio
  const photoX = x + 4.5;
  const photoY = y + 14.5;
  const photoW = 19.5;
  const photoH = 26;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(18, 60, 46);
  doc.setLineWidth(0.4);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, 'FD');

  let imageDrawn = false;
  if (data.avatarUrl) {
    try {
      const format = data.avatarUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(data.avatarUrl, format, photoX + 0.3, photoY + 0.3, photoW - 0.6, photoH - 0.6);
      imageDrawn = true;
    } catch {
      imageDrawn = false;
    }
  }

  if (!imageDrawn) {
    // Silhouette / Initials placeholder
    doc.setTextColor(18, 60, 46);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const initials = data.fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('');
    doc.text(initials || (isStudent ? 'S' : 'F'), photoX + photoW / 2, photoY + 14, { align: 'center' });

    doc.setFontSize(3.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(isStudent ? 'STUDENT' : 'FACULTY', photoX + photoW / 2, photoY + 22, { align: 'center' });
  }

  // Right Side Data
  const textX = x + 26.5;
  let curY = y + 16.5;

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  const truncatedName = doc.splitTextToSize(data.fullName, 42);
  doc.text(truncatedName[0] || data.fullName, textX, curY);
  curY += 4.5;

  // Key / SubDetail (Class or Designation in Forest Green)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(18, 60, 46);
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
  doc.roundedRect(textX, curY, 25, 3.8, 0.8, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.6);
  doc.setTextColor(isActive ? 22 : 185, isActive ? 101 : 28, isActive ? 52 : 28);
  doc.text(isActive ? '● ACTIVE ENROLLED' : `● ${data.status}`, textX + 12.5, curY + 2.7, { align: 'center' });

  // Dynamic QR Code Block (Bottom Right)
  const qrX = x + w - 17.5;
  const qrY = y + h - 18.5;
  const qrSize = 13.5;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrX, qrY, qrSize, qrSize, 0.8, 0.8, 'FD');

  if (data.qrDataUrl) {
    try {
      doc.addImage(data.qrDataUrl, 'PNG', qrX + 0.5, qrY + 0.5, qrSize - 1, qrSize - 1);
    } catch {
      // Fallback border
    }
  }

  // QR label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.8);
  doc.setTextColor(18, 60, 46);
  doc.text('SCAN TO VERIFY', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });

  // Footer Serial / Card Number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`CARD NO: ${data.cardNumber}`, x + 4.5, y + h - 2.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 60, 46);
  doc.text(`ISO CR80 TAMPER-PROOF`, x + 38, y + h - 2.5);
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
  const primaryColor = template.primaryColor || '#123c2e';
  const schoolName = (data.schoolName || 'APEX ACADEMY OF SCIENCES & ARTS').toUpperCase();
  const schoolAddress = data.schoolAddress || 'Plot 42, Knowledge Park III, Institutional Area';
  const schoolPhone = data.schoolPhone || '+91 11 2659 1000';
  const schoolEmail = data.schoolEmail || 'admin@apexacademy.edu';
  const isStudent = data.holderType === 'STUDENT';

  // Card Outer Rounded Box
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Top Forest Green Accent Strip
  doc.setFillColor(primaryColor);
  doc.rect(x, y, w, 2.5, 'F');

  let curY = y + 6;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(18, 60, 46);
  doc.text(
    isStudent ? 'STUDENT VERIFICATION & INSTITUTIONAL RECORD' : 'FACULTY VERIFICATION & INSTITUTIONAL RECORD',
    x + w / 2,
    curY,
    { align: 'center' }
  );
  curY += 4.5;

  // Contact Grid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`Campus: ${schoolAddress}`, x + 5, curY);
  curY += 3.2;
  doc.text(`Telephone: ${schoolPhone} | Email: ${schoolEmail}`, x + 5, curY);
  curY += 3.5;

  // Emergency / Parent Line
  if (template.showEmergencyPhone !== false && data.emergencyPhone) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28); // Alert red
    const phoneLabel = isStudent ? 'Emergency / Parent Contact:' : 'Emergency Contact:';
    doc.text(`${phoneLabel} ${data.emergencyPhone}`, x + 5, curY);
    curY += 3.8;
  }

  // Terms and Conditions text box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(x + 5, curY, w - 10, 11, 1, 1, 'FD');

  doc.setFontSize(4);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('• This smart credential is institutional property and must be carried on campus premises.', x + 6.5, curY + 3);
  doc.text('• Required for campus access, library circulation, and official examinations.', x + 6.5, curY + 6);
  doc.text('• If lost or found, please surrender immediately to the School Administration Office.', x + 6.5, curY + 9);
  curY += 13.5;

  // Signatures Area
  const sigY = y + h - 11;

  // Official Seal box
  if (template.showSchoolSeal !== false) {
    doc.setDrawColor(197, 155, 39); // Gold
    doc.setLineWidth(0.3);
    doc.roundedRect(x + 8, sigY - 1.5, 17, 8.5, 1, 1);
    doc.setFontSize(3.6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 60, 46);
    doc.text('OFFICIAL SEAL', x + 16.5, sigY + 2.5, { align: 'center' });
    doc.setFontSize(3.0);
    doc.setTextColor(197, 155, 39);
    doc.text('EDUNEXA VERIFIED', x + 16.5, sigY + 5.5, { align: 'center' });
  }

  // Principal Signature Line
  if (template.showPrincipalSign !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(18, 60, 46);
    doc.text('Principal Signature', x + w - 18, sigY + 1.5, { align: 'center' });

    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.3);
    doc.line(x + w - 30, sigY + 3.5, x + w - 6, sigY + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.2);
    doc.setTextColor(15, 23, 42);
    doc.text('Principal / Registrar', x + w - 18, sigY + 6.5, { align: 'center' });
  }

  // Bottom token & verification URL
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.0);
  doc.setTextColor(100, 116, 139);
  doc.text(`Token: ${data.verificationToken}  |  Web: edunexa.up.railway.app/verify-id`, x + w / 2, y + h - 1.8, {
    align: 'center',
  });
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
 * Download Individual ID Card PDF with embedded photograph and dynamic scannable QR code.
 */
export async function downloadIndividualIdCardPdf(
  data: IdCardRenderData,
  template: IdCardTemplateSettings = {},
  fileName?: string
): Promise<void> {
  const cloned = { ...data };

  // 1. Resolve avatar image to base64 if provided as a remote or local URL
  if (cloned.avatarUrl && !cloned.avatarUrl.startsWith('data:image')) {
    const b64 = await resolveImageBase64(cloned.avatarUrl);
    if (b64) cloned.avatarUrl = b64;
  }

  // 2. Generate genuine high-resolution scannable QR code dataURL
  if (!cloned.qrDataUrl && cloned.verificationToken) {
    try {
      const verificationUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/verify-id/${encodeURIComponent(cloned.verificationToken)}`
          : `https://edunexa.up.railway.app/verify-id/${encodeURIComponent(cloned.verificationToken)}`;
      cloned.qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (err) {
      console.warn('[downloadIndividualIdCardPdf] QR generation notice:', err);
    }
  }

  const doc = generateIndividualIdCardPdf(cloned, template);
  const cleanId = (cloned.identifier || 'id-card').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  doc.save(fileName || `id-card-${cleanId}.pdf`);
}

/**
 * Generate Print-Ready Bulk ID Cards PDF on Standard A4 Sheets.
 * Layout: 8 Cards per A4 Sheet (2 columns x 4 rows).
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

    // Front Sides
    if (batchIdx > 0) doc.addPage('a4', 'portrait');

    batchCards.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = startX + col * (cardW + colGap);
      const y = startY + row * (cardH + rowGap);
      drawCardFront(doc, x, y, c, template);
    });

    // Back Sides (Mirrored Horizontally for 2-sided duplex printing)
    doc.addPage('a4', 'portrait');
    batchCards.forEach((c, idx) => {
      const col = 1 - (idx % 2); // Mirrored column
      const row = Math.floor(idx / 2);
      const x = startX + col * (cardW + colGap);
      const y = startY + row * (cardH + rowGap);
      drawCardBack(doc, x, y, c, template);
    });
  }

  return doc;
}

/**
 * Download Bulk ID Cards PDF.
 */
export async function downloadBulkIdCardsPdf(
  cards: IdCardRenderData[],
  template: IdCardTemplateSettings = {},
  fileName = 'edunexa-id-cards-batch.pdf'
): Promise<void> {
  const preparedCards = await Promise.all(
    cards.map(async (c) => {
      const cloned = { ...c };
      if (cloned.avatarUrl && !cloned.avatarUrl.startsWith('data:image')) {
        const b64 = await resolveImageBase64(cloned.avatarUrl);
        if (b64) cloned.avatarUrl = b64;
      }
      if (!cloned.qrDataUrl && cloned.verificationToken) {
        try {
          const verificationUrl =
            typeof window !== 'undefined'
              ? `${window.location.origin}/verify-id/${encodeURIComponent(cloned.verificationToken)}`
              : `https://edunexa.up.railway.app/verify-id/${encodeURIComponent(cloned.verificationToken)}`;
          cloned.qrDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 240,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
        } catch {
          // fallback
        }
      }
      return cloned;
    })
  );

  const doc = generateBulkIdCardsPdf(preparedCards, template);
  doc.save(fileName);
}

