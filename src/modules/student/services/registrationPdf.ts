import { jsPDF } from 'jspdf';

export interface OfficialRegistrationPdfUnit {
  code: string;
  title: string;
  credits: number;
}

export interface OfficialRegistrationPdfPeriod {
  id: string;
  academicYear: string;
  semesterName: string;
  intakeCode: string;
  approvalStatus: string;
  totalCredits: number;
  feeThresholdCleared: boolean;
  registeredAt?: string | null;
  approvedByName?: string | null;
  units: OfficialRegistrationPdfUnit[];
}

export interface OfficialRegistrationPdfInput {
  student: {
    registrationNumber: string;
    fullName: string;
    programmeName?: string | null;
    campusName?: string | null;
    studentStatus?: string | null;
  };
  registrations: OfficialRegistrationPdfPeriod[];
}

export interface ApprovedRegistrationSummary {
  approvedRegistrations: OfficialRegistrationPdfPeriod[];
  totalApprovedUnits: number;
  totalApprovedCredits: number;
}

function sanitizePdfText(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractApprovedRegistrations(
  input: OfficialRegistrationPdfInput
): ApprovedRegistrationSummary {
  const approvedRegistrations = input.registrations.filter(
    (reg) => String(reg.approvalStatus ?? '').trim().toUpperCase() === 'APPROVED'
  );

  if (approvedRegistrations.length === 0) {
    throw new Error(
      'No approved official registrations are available to download. Only registrations with APPROVED status can be exported.'
    );
  }

  let totalApprovedUnits = 0;
  let totalApprovedCredits = 0;

  for (const reg of approvedRegistrations) {
    const units = Array.isArray(reg.units) ? reg.units : [];
    totalApprovedUnits += units.length;
    totalApprovedCredits +=
      typeof reg.totalCredits === 'number' && reg.totalCredits > 0
        ? reg.totalCredits
        : units.reduce((sum, u) => sum + Number(u.credits || 0), 0);
  }

  return {
    approvedRegistrations,
    totalApprovedUnits,
    totalApprovedCredits,
  };
}

export function buildOfficialRegistrationFilename(regNo: string): string {
  const safeReg = sanitizePdfText(regNo || 'STUDENT')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `Official-Registration-${safeReg || 'STUDENT'}.pdf`;
}

export function buildOfficialRegistrationPdfDocument(
  input: OfficialRegistrationPdfInput
): jsPDF {
  const {
    approvedRegistrations,
    totalApprovedUnits,
    totalApprovedCredits,
  } = extractApprovedRegistrations(input);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;

  // Institutional Navy Header Banner
  doc.setFillColor(9, 44, 96); // #092C60
  doc.rect(0, 0, pageWidth, 88, 'F');
  doc.setFillColor(184, 50, 50); // #B83232
  doc.rect(0, 88, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('HI-TECH COLLEGE · ACADEMIC REGISTRY', margin, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    'OFFICIAL ACADEMIC REGISTRATION & APPROVED UNITS CONFIRMATION',
    margin,
    56
  );
  doc.setFontSize(8.5);
  doc.text(
    `Issued: ${new Date().toISOString().slice(0, 10)} · Status Filter: APPROVED ONLY`,
    margin,
    72
  );

  let y = 116;

  // Student Profile Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 86, 6, 6, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CANDIDATE & ACADEMIC STANDING', margin + 12, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const leftColX = margin + 12;
  const rightColX = margin + contentWidth / 2 + 8;

  doc.text(
    `Full Name: ${sanitizePdfText(input.student.fullName) || 'Authenticated Student'}`,
    leftColX,
    y + 36
  );
  doc.text(
    `Reg. Number: ${sanitizePdfText(input.student.registrationNumber)}`,
    rightColX,
    y + 36
  );
  doc.text(
    `Programme: ${sanitizePdfText(input.student.programmeName) || 'Registered Programme'}`,
    leftColX,
    y + 54
  );
  doc.text(
    `Campus: ${sanitizePdfText(input.student.campusName) || 'Main Campus'}`,
    rightColX,
    y + 54
  );
  doc.text(
    `Academic Status: ${sanitizePdfText(input.student.studentStatus) || 'ACTIVE'}`,
    leftColX,
    y + 72
  );
  doc.text(
    `Approved Summary: ${approvedRegistrations.length} Period(s) · ${totalApprovedUnits} Units · ${totalApprovedCredits} Credits`,
    rightColX,
    y + 72
  );

  y += 108;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 54) {
      doc.addPage();
      y = 48;
    }
  };

  for (const reg of approvedRegistrations) {
    ensureSpace(88);

    // Period Banner
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin, y, contentWidth, 38, 4, 4, 'FD');

    doc.setTextColor(6, 95, 70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(
      `${sanitizePdfText(reg.academicYear)} · ${sanitizePdfText(reg.semesterName)} (${sanitizePdfText(reg.intakeCode)})`,
      margin + 10,
      y + 16
    );
    doc.text('STATUS: APPROVED', pageWidth - margin - 10, y + 16, {
      align: 'right',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const metaParts = [
      `Total Credits: ${reg.totalCredits}`,
      `Fee Clearance: ${reg.feeThresholdCleared ? 'CLEARED' : 'FEE HOLD'}`,
    ];
    if (reg.approvedByName) {
      metaParts.push(`Approved By: ${sanitizePdfText(reg.approvedByName)}`);
    }
    if (reg.registeredAt) {
      metaParts.push(`Recorded: ${String(reg.registeredAt).slice(0, 10)}`);
    }
    doc.text(metaParts.join('   |   '), margin + 10, y + 30);

    y += 46;

    // Units Table Header
    ensureSpace(26);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 22, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('UNIT CODE', margin + 10, y + 14);
    doc.text('UNIT TITLE', margin + 115, y + 14);
    doc.text('CREDITS', pageWidth - margin - 10, y + 14, { align: 'right' });

    y += 22;

    const units = Array.isArray(reg.units) ? reg.units : [];
    for (const unit of units) {
      const wrappedTitle = doc.splitTextToSize(
        sanitizePdfText(unit.title),
        contentWidth - 180
      ) as string[];
      const rowHeight = Math.max(22, wrappedTitle.length * 12 + 10);
      ensureSpace(rowHeight);

      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, rowHeight, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(16, 45, 80);
      doc.text(sanitizePdfText(unit.code), margin + 10, y + 14);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(wrappedTitle, margin + 115, y + 14);

      doc.setFont('helvetica', 'bold');
      doc.text(String(unit.credits), pageWidth - margin - 10, y + 14, {
        align: 'right',
      });

      y += rowHeight;
    }

    y += 16;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'HI-TECH College Academic Registry · Official computer-generated confirmation of APPROVED unit registrations.',
      margin,
      pageHeight - 22
    );
    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 22,
      { align: 'right' }
    );
  }

  return doc;
}

export function exportOfficialRegistrationPdfBytes(
  input: OfficialRegistrationPdfInput
): Uint8Array {
  const doc = buildOfficialRegistrationPdfDocument(input);
  const buffer = doc.output('arraybuffer');
  return new Uint8Array(buffer);
}

export function downloadOfficialRegistrationPdf(
  input: OfficialRegistrationPdfInput
): string {
  const doc = buildOfficialRegistrationPdfDocument(input);
  const filename = buildOfficialRegistrationFilename(
    input.student.registrationNumber
  );
  doc.save(filename);
  return filename;
}
