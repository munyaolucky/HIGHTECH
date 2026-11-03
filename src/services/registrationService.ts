/**
 * HI-TECH Central Automatic Registration Number Generator Service
 * Standard Format: HCA/<TYPE>/<YEAR>/<SEQ>
 * e.g. HCA/STAFF/2026/001, HCA/STU/2026/001, HCA/CERT/2026/001
 * 
 * Rules:
 * - Format strictly enforces HCA/<TYPE>/<YEAR>/<SEQ>
 * - Sequences are independent per (institutionCode, recordType, year)
 * - Atomic incrementing logic prevents race conditions and collisions
 * - Sequence padding defaults to 3 digits (001, 002, ...)
 */

import { RegistrationRecordType, RegistrationIssuance, RegistrationSequenceRecord } from '../types';

const STORAGE_KEY_SEQUENCES = 'hca_reg_sequences_v1';
const STORAGE_KEY_ISSUANCES = 'hca_reg_issuances_v1';

export const VALID_RECORD_TYPES: { type: RegistrationRecordType; label: string; description: string; sample: string }[] = [
  { type: 'STAFF', label: 'Staff Member', description: 'Administrative, HR, Technical & Support Staff', sample: 'HCA/STAFF/2026/001' },
  { type: 'STU', label: 'Student', description: 'Enrolled Certificate, Diploma & Degree Students', sample: 'HCA/STU/2026/001' },
  { type: 'LECT', label: 'Lecturer / Trainer', description: 'Academic Teaching Faculty & TVET Assessors', sample: 'HCA/LECT/2026/001' },
  { type: 'ADMIN', label: 'Platform Admin', description: 'Institutional Governance & System Controllers', sample: 'HCA/ADMIN/2026/001' },
  { type: 'PARENT', label: 'Parent / Guardian', description: 'Registered Parent & Sponsor Accounts', sample: 'HCA/PARENT/2026/001' },
  { type: 'APP', label: 'Applicant', description: 'Prospective Student Application Tracking', sample: 'HCA/APP/2026/001' },
  { type: 'CERT', label: 'Official Certificate', description: 'Graduation, Modular & Professional Credentials', sample: 'HCA/CERT/2026/001' },
  { type: 'LIB', label: 'Library Record', description: 'Library Member Card & Catalogue Assets', sample: 'HCA/LIB/2026/001' },
  { type: 'EXAM', label: 'Examination Candidate', description: 'KNEC/KASNEB/TVET Exam Registry Number', sample: 'HCA/EXAM/2026/001' },
  { type: 'DEPT', label: 'Departmental Unit', description: 'Academic Departments & Specialized Centres', sample: 'HCA/DEPT/2026/001' },
  { type: 'CAMP', label: 'Campus Branch', description: 'Regional Accredited Campus Identifier', sample: 'HCA/CAMP/2026/001' },
];

const INITIAL_ISSUANCES: RegistrationIssuance[] = [
  {
    id: 'iss-staff-001',
    registrationNumber: 'HCA/STAFF/2026/001',
    institutionCode: 'HCA',
    recordType: 'STAFF',
    year: 2026,
    sequenceNumber: 1,
    recipientName: 'Dr. Kiprop Chemweno',
    identifierReference: 'ID-24891023',
    department: 'Office of the Academic Registrar',
    programmeOrRole: 'Chief Academic Registrar',
    campus: 'Nairobi Main Campus',
    issuedBy: 'System Auto-Provisioning',
    issuedAt: '2026-01-05T08:30:00Z',
    status: 'ACTIVE',
    metadata: { nationalId: '24891023', rank: 'Executive' },
  },
  {
    id: 'iss-staff-002',
    registrationNumber: 'HCA/STAFF/2026/002',
    institutionCode: 'HCA',
    recordType: 'STAFF',
    year: 2026,
    sequenceNumber: 2,
    recipientName: 'Eng. Grace Njeri Kamau',
    identifierReference: 'ID-28190344',
    department: 'School of Computing & Informatics',
    programmeOrRole: 'Dean & Systems Lead',
    campus: 'Nairobi Main Campus',
    issuedBy: 'System Auto-Provisioning',
    issuedAt: '2026-01-05T09:15:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'iss-lect-001',
    registrationNumber: 'HCA/LECT/2026/001',
    institutionCode: 'HCA',
    recordType: 'LECT',
    year: 2026,
    sequenceNumber: 1,
    recipientName: 'Dr. Peter Otieno Onyango',
    identifierReference: 'ID-29441209',
    department: 'Computer Science & Software Eng.',
    programmeOrRole: 'Senior Lecturer / Assessor',
    campus: 'Nairobi Main Campus',
    issuedBy: 'Registrar Approval Workflow',
    issuedAt: '2026-01-06T10:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'iss-lect-002',
    registrationNumber: 'HCA/LECT/2026/002',
    institutionCode: 'HCA',
    recordType: 'LECT',
    year: 2026,
    sequenceNumber: 2,
    recipientName: 'Eunice Mutua',
    identifierReference: 'ID-31209845',
    department: 'Artificial Intelligence & Data',
    programmeOrRole: 'Lecturer & Lab Director',
    campus: 'Nairobi Main Campus',
    issuedBy: 'Registrar Approval Workflow',
    issuedAt: '2026-01-06T11:20:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'iss-stu-001',
    registrationNumber: 'HCA/STU/2026/001',
    institutionCode: 'HCA',
    recordType: 'STU',
    year: 2026,
    sequenceNumber: 1,
    recipientName: 'Amina Wanjiku',
    identifierReference: 'KCSE-2025-1102941',
    department: 'School of Computing & Informatics',
    programmeOrRole: 'BSc. Computer Science',
    campus: 'Nairobi Main Campus',
    issuedBy: 'Admissions Acceptance Engine',
    issuedAt: '2026-01-10T14:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'iss-stu-002',
    registrationNumber: 'HCA/STU/2026/002',
    institutionCode: 'HCA',
    recordType: 'STU',
    year: 2026,
    sequenceNumber: 2,
    recipientName: 'Brian Kipruto',
    identifierReference: 'KCSE-2025-3091823',
    department: 'Cyber Security & Forensics',
    programmeOrRole: 'Diploma in Cyber Security',
    campus: 'Mombasa Campus',
    issuedBy: 'Admissions Acceptance Engine',
    issuedAt: '2026-01-10T15:30:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'iss-cert-001',
    registrationNumber: 'HCA/CERT/2026/001',
    institutionCode: 'HCA',
    recordType: 'CERT',
    year: 2026,
    sequenceNumber: 1,
    recipientName: 'Faith Chebet',
    identifierReference: 'HCA/STU/2024/089',
    department: 'Information Technology',
    programmeOrRole: 'Diploma in Information Communication Technology',
    campus: 'Nairobi Main Campus',
    issuedBy: 'Academic Senate Clearance',
    issuedAt: '2026-01-15T09:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'iss-lib-001',
    registrationNumber: 'HCA/LIB/2026/001',
    institutionCode: 'HCA',
    recordType: 'LIB',
    year: 2026,
    sequenceNumber: 1,
    recipientName: 'Amina Wanjiku',
    identifierReference: 'HCA/STU/2026/001',
    department: 'School of Computing & Informatics',
    programmeOrRole: 'Student Library Pass',
    campus: 'Nairobi Main Campus',
    issuedBy: 'Central Library System',
    issuedAt: '2026-01-11T09:00:00Z',
    status: 'ACTIVE',
  },
];

class RegistrationService {
  private issuances: RegistrationIssuance[] = [];
  private sequences: Map<string, RegistrationSequenceRecord> = new Map();

  constructor() {
    this.loadState();
  }

  private getSequenceKey(institutionCode: string, recordType: RegistrationRecordType, year: number): string {
    return `${institutionCode.toUpperCase()}_${recordType.toUpperCase()}_${year}`;
  }

  private loadState(): void {
    try {
      const storedIssuances = localStorage.getItem(STORAGE_KEY_ISSUANCES);
      if (storedIssuances) {
        this.issuances = JSON.parse(storedIssuances);
      } else {
        this.issuances = [...INITIAL_ISSUANCES];
        this.saveIssuances();
      }

      const storedSequences = localStorage.getItem(STORAGE_KEY_SEQUENCES);
      if (storedSequences) {
        const parsed = JSON.parse(storedSequences) as RegistrationSequenceRecord[];
        this.sequences = new Map(parsed.map(s => [this.getSequenceKey(s.institutionCode, s.recordType, s.year), s]));
      } else {
        // Derive initial sequence state from issuances
        this.syncSequencesFromIssuances();
      }
    } catch {
      this.issuances = [...INITIAL_ISSUANCES];
      this.syncSequencesFromIssuances();
    }
  }

  private syncSequencesFromIssuances(): void {
    this.sequences.clear();
    for (const item of this.issuances) {
      const key = this.getSequenceKey(item.institutionCode, item.recordType, item.year);
      const existing = this.sequences.get(key);
      const currentMax = existing ? Math.max(existing.currentSequence, item.sequenceNumber) : item.sequenceNumber;
      this.sequences.set(key, {
        institutionCode: item.institutionCode,
        recordType: item.recordType,
        year: item.year,
        currentSequence: currentMax,
        padLength: 3,
        lastUpdated: item.issuedAt,
      });
    }
    this.saveSequences();
  }

  private saveIssuances(): void {
    try {
      localStorage.setItem(STORAGE_KEY_ISSUANCES, JSON.stringify(this.issuances));
    } catch (e) {
      console.error('Failed to save issuances to localStorage', e);
    }
  }

  private saveSequences(): void {
    try {
      const list = Array.from(this.sequences.values());
      localStorage.setItem(STORAGE_KEY_SEQUENCES, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save sequences to localStorage', e);
    }
  }

  /**
   * Formats sequence number with leading zeros (e.g. 1 -> "001", 12 -> "012", 100 -> "100")
   */
  public padSequence(seq: number, padLength: number = 3): string {
    return seq.toString().padStart(padLength, '0');
  }

  /**
   * Builds the canonical registration number:
   * Format: <INSTITUTION>/<TYPE>/<YEAR>/<SEQ>
   * e.g. HCA/STAFF/2026/001
   */
  public buildRegistrationNumber(
    institutionCode: string,
    recordType: RegistrationRecordType,
    year: number,
    sequenceNumber: number,
    padLength: number = 3
  ): string {
    const padded = this.padSequence(sequenceNumber, padLength);
    return `${institutionCode.toUpperCase()}/${recordType.toUpperCase()}/${year}/${padded}`;
  }

  /**
   * Inspects the next upcoming sequence number without advancing the counter
   */
  public peekNextSequence(
    recordType: RegistrationRecordType,
    year: number = new Date().getFullYear(),
    institutionCode: string = 'HCA'
  ): { nextSequence: number; nextRegNo: string } {
    const key = this.getSequenceKey(institutionCode, recordType, year);
    const existing = this.sequences.get(key);
    const nextSequence = existing ? existing.currentSequence + 1 : 1;
    const padLength = existing ? existing.padLength : 3;
    const nextRegNo = this.buildRegistrationNumber(institutionCode, recordType, year, nextSequence, padLength);
    return { nextSequence, nextRegNo };
  }

  /**
   * Generates and commits a new registration number atomically
   */
  public generateNextRegistrationNumber(params: {
    recordType: RegistrationRecordType;
    year?: number;
    institutionCode?: string;
    recipientName: string;
    identifierReference: string;
    department?: string;
    programmeOrRole?: string;
    campus?: string;
    issuedBy?: string;
    metadata?: Record<string, any>;
  }): RegistrationIssuance {
    const institutionCode = (params.institutionCode || 'HCA').trim().toUpperCase();
    const year = params.year || new Date().getFullYear();
    const key = this.getSequenceKey(institutionCode, params.recordType, year);

    let seqRecord = this.sequences.get(key);
    let newSequence = 1;

    if (seqRecord) {
      newSequence = seqRecord.currentSequence + 1;
      seqRecord.currentSequence = newSequence;
      seqRecord.lastUpdated = new Date().toISOString();
    } else {
      seqRecord = {
        institutionCode,
        recordType: params.recordType,
        year,
        currentSequence: 1,
        padLength: 3,
        lastUpdated: new Date().toISOString(),
      };
      this.sequences.set(key, seqRecord);
    }

    const regNo = this.buildRegistrationNumber(
      institutionCode,
      params.recordType,
      year,
      newSequence,
      seqRecord.padLength
    );

    const issuance: RegistrationIssuance = {
      id: `iss-${params.recordType.toLowerCase()}-${Date.now()}-${newSequence}`,
      registrationNumber: regNo,
      institutionCode,
      recordType: params.recordType,
      year,
      sequenceNumber: newSequence,
      recipientName: params.recipientName.trim(),
      identifierReference: params.identifierReference.trim(),
      department: params.department || 'General Academic Operations',
      programmeOrRole: params.programmeOrRole || params.recordType,
      campus: params.campus || 'Nairobi Main Campus',
      issuedBy: params.issuedBy || 'Central Registration Authority',
      issuedAt: new Date().toISOString(),
      status: 'ACTIVE',
      metadata: params.metadata,
    };

    this.issuances.unshift(issuance);
    this.saveSequences();
    this.saveIssuances();

    return issuance;
  }

  /**
   * Validates if a registration number strictly conforms to HCA/<TYPE>/<YEAR>/<SEQ>
   */
  public parseAndValidate(regNo: string): {
    isValid: boolean;
    institutionCode?: string;
    recordType?: RegistrationRecordType;
    year?: number;
    sequenceNumber?: number;
    error?: string;
  } {
    if (!regNo || typeof regNo !== 'string') {
      return { isValid: false, error: 'Registration number is missing or empty' };
    }

    const parts = regNo.trim().toUpperCase().split('/');
    if (parts.length !== 4) {
      return {
        isValid: false,
        error: `Expected 4 slash-separated segments (e.g. HCA/STAFF/2026/001), found ${parts.length}`,
      };
    }

    const [inst, typeStr, yearStr, seqStr] = parts;

    if (inst !== 'HCA' && !/^[A-Z]{3,5}$/.test(inst)) {
      return { isValid: false, error: `Invalid institution code prefix '${inst}'. Must be HCA` };
    }

    const validTypes: string[] = VALID_RECORD_TYPES.map(t => t.type);
    if (!validTypes.includes(typeStr)) {
      return {
        isValid: false,
        error: `Invalid record type '${typeStr}'. Allowed types: ${validTypes.join(', ')}`,
      };
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return { isValid: false, error: `Invalid year '${yearStr}'. Must be 4 digits (2000-2100)` };
    }

    const seq = parseInt(seqStr, 10);
    if (isNaN(seq) || seq <= 0) {
      return { isValid: false, error: `Invalid sequence segment '${seqStr}'. Must be positive digits` };
    }

    return {
      isValid: true,
      institutionCode: inst,
      recordType: typeStr as RegistrationRecordType,
      year,
      sequenceNumber: seq,
    };
  }

  /**
   * Looks up an issued registration number in the central ledger
   */
  public lookupIssuance(regNo: string): RegistrationIssuance | undefined {
    const clean = regNo.trim().toUpperCase();
    return this.issuances.find(i => i.registrationNumber.toUpperCase() === clean);
  }

  /**
   * Retrieves all issued records with optional filtering
   */
  public getAllIssuances(filter?: {
    recordType?: RegistrationRecordType;
    year?: number;
    search?: string;
  }): RegistrationIssuance[] {
    let list = [...this.issuances];
    if (!filter) return list;

    if (filter.recordType) {
      list = list.filter(i => i.recordType === filter.recordType);
    }
    if (filter.year) {
      list = list.filter(i => i.year === filter.year);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        i =>
          i.registrationNumber.toLowerCase().includes(q) ||
          i.recipientName.toLowerCase().includes(q) ||
          i.identifierReference.toLowerCase().includes(q) ||
          (i.department && i.department.toLowerCase().includes(q))
      );
    }
    return list;
  }

  /**
   * Returns current sequence statuses across types for a given year
   */
  public getSequenceSummary(year: number = new Date().getFullYear(), institutionCode: string = 'HCA') {
    return VALID_RECORD_TYPES.map(t => {
      const key = this.getSequenceKey(institutionCode, t.type, year);
      const seq = this.sequences.get(key);
      const currentSeq = seq ? seq.currentSequence : 0;
      const nextRegNo = this.buildRegistrationNumber(institutionCode, t.type, year, currentSeq + 1, 3);
      return {
        ...t,
        year,
        currentSequence: currentSeq,
        nextSequence: currentSeq + 1,
        nextRegistrationNumber: nextRegNo,
        totalIssued: this.issuances.filter(i => i.recordType === t.type && i.year === year).length,
      };
    });
  }

  /**
   * Batch generation utility
   */
  public batchGenerate(
    items: Array<{
      recordType: RegistrationRecordType;
      recipientName: string;
      identifierReference: string;
      department?: string;
      programmeOrRole?: string;
      campus?: string;
    }>,
    year: number = new Date().getFullYear(),
    institutionCode: string = 'HCA'
  ): RegistrationIssuance[] {
    return items.map(item =>
      this.generateNextRegistrationNumber({
        ...item,
        year,
        institutionCode,
        issuedBy: 'Batch Registration Wizard',
      })
    );
  }
}

export const registrationService = new RegistrationService();
