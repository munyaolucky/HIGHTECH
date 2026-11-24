import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const PRIVATE_DMS_STORAGE_ROOT = path.resolve(
  process.cwd(),
  '.data',
  'private-dms-storage'
);

const DOWNLOAD_TOKEN_SECRET =
  process.env.DOCUMENT_DOWNLOAD_SECRET ||
  process.env.SESSION_SECRET ||
  'hitech-college-dms-hmac-2026';

export const PERMITTED_DMS_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.ppt',
  '.pptx',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.zip',
  '.mp4',
  '.mp3',
  '.wav',
  '.txt',
]);

const FORBIDDEN_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.js',
  '.mjs',
  '.cjs',
  '.msi',
  '.vbs',
  '.ps1',
  '.php',
  '.py',
  '.rb',
  '.pl',
  '.jar',
  '.dll',
  '.so',
  '.dylib',
  '.html',
  '.htm',
  '.svg',
]);

const EICAR_SIGNATURE =
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

export interface FileValidationResult {
  ok: boolean;
  error?: string;
  scanStatus: 'VERIFIED_CLEAN' | 'QUARANTINED';
  checksumSha256: string;
  byteLength: number;
}

export function sanitizeFileName(rawName: string): string {
  const base = path.basename(String(rawName || 'document.pdf')).trim();
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return cleaned.slice(0, 120) || 'document.bin';
}

export function ensurePrivateStorageDir(): void {
  if (!fs.existsSync(PRIVATE_DMS_STORAGE_ROOT)) {
    fs.mkdirSync(PRIVATE_DMS_STORAGE_ROOT, { recursive: true });
  }
}

export function resolveSafeStoragePath(relativeStoragePath: string): string {
  const raw = String(relativeStoragePath || '').trim();
  if (!raw || path.isAbsolute(raw) || raw.includes('\0')) {
    throw new Error('Path traversal rejected: storage path escapes private DMS root.');
  }
  const normalized = path.normalize(raw);
  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith(`..${path.sep}`) ||
    normalized.includes(`${path.sep}..${path.sep}`) ||
    normalized.endsWith(`${path.sep}..`)
  ) {
    throw new Error('Path traversal rejected: storage path escapes private DMS root.');
  }
  const resolved = path.resolve(PRIVATE_DMS_STORAGE_ROOT, normalized);
  if (!resolved.startsWith(PRIVATE_DMS_STORAGE_ROOT + path.sep)) {
    throw new Error('Path traversal rejected: storage path escapes private DMS root.');
  }
  return resolved;
}

function hasDoubleDangerousExtension(fileName: string): boolean {
  const parts = fileName.toLowerCase().split('.');
  if (parts.length <= 2) return false;
  for (let i = 1; i < parts.length; i += 1) {
    if (FORBIDDEN_EXTENSIONS.has(`.${parts[i]}`)) return true;
  }
  return false;
}

function checkMagicBytes(ext: string, buf: Buffer): { valid: boolean; reason?: string } {
  if (buf.length === 0) return { valid: false, reason: 'Empty file buffer.' };

  // Block binary executables disguised as documents (PE MZ, ELF, Mach-O)
  if (buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a) {
    return { valid: false, reason: 'Executable PE/MZ header blocked by security scanner.' };
  }
  if (
    buf.length >= 4 &&
    buf[0] === 0x7f &&
    buf[1] === 0x45 &&
    buf[2] === 0x4c &&
    buf[3] === 0x46
  ) {
    return { valid: false, reason: 'Executable ELF header blocked by security scanner.' };
  }
  if (
    buf.length >= 4 &&
    ((buf[0] === 0xcf && buf[1] === 0xfa && buf[2] === 0xed && buf[3] === 0xfe) ||
      (buf[0] === 0xfe && buf[1] === 0xed && buf[2] === 0xfa && buf[3] === 0xce))
  ) {
    return { valid: false, reason: 'Executable Mach-O binary blocked by security scanner.' };
  }

  // Active-content / script / EICAR scan across text-inspectable buffers
  const asciiSample = buf.subarray(0, Math.min(buf.length, 64 * 1024)).toString('utf8');
  if (asciiSample.includes(EICAR_SIGNATURE)) {
    return { valid: false, reason: 'Malware test signature (EICAR) detected and quarantined.' };
  }
  if (
    /<script[\s>]/i.test(asciiSample) ||
    /<\?php/i.test(asciiSample) ||
    /javascript:/i.test(asciiSample)
  ) {
    return { valid: false, reason: 'Active script payload detected inside file and quarantined.' };
  }

  // Only enforce strict format magic bytes when payload appears to be full binary (> 4 bytes)
  if (ext === '.pdf') {
    const head = buf.subarray(0, 16).toString('ascii');
    if (!head.includes('%PDF-')) {
      return { valid: false, reason: 'File extension is .pdf but magic bytes do not match %PDF- signature.' };
    }
  } else if (ext === '.png') {
    if (
      buf.length < 8 ||
      buf[0] !== 0x89 ||
      buf[1] !== 0x50 ||
      buf[2] !== 0x4e ||
      buf[3] !== 0x47
    ) {
      return { valid: false, reason: 'File extension is .png but magic bytes do not match PNG signature.' };
    }
  } else if (ext === '.jpg' || ext === '.jpeg') {
    if (buf.length < 3 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) {
      return { valid: false, reason: 'File extension is JPEG but magic bytes do not match JPEG SOI signature.' };
    }
  } else if (ext === '.webp') {
    const riff = buf.subarray(0, 4).toString('ascii');
    const webp = buf.subarray(8, 12).toString('ascii');
    if (riff !== 'RIFF' || webp !== 'WEBP') {
      return { valid: false, reason: 'File extension is .webp but magic bytes do not match RIFF/WEBP.' };
    }
  } else if (ext === '.docx' || ext === '.xlsx' || ext === '.pptx' || ext === '.zip') {
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
      return { valid: false, reason: `File extension is ${ext} but lacks valid PKZIP container signature.` };
    }
  } else if (ext === '.doc' || ext === '.xls' || ext === '.ppt') {
    if (
      buf.length < 4 ||
      buf[0] !== 0xd0 ||
      buf[1] !== 0xcf ||
      buf[2] !== 0x11 ||
      buf[3] !== 0xe0
    ) {
      return { valid: false, reason: `File extension is ${ext} but lacks valid OLE Compound Document signature.` };
    }
  } else if (ext === '.mp4') {
    const box = buf.subarray(4, 12).toString('ascii');
    if (!box.includes('ftyp')) {
      return { valid: false, reason: 'File extension is .mp4 but lacks ISO Base Media ftyp box signature.' };
    }
  } else if (ext === '.wav') {
    const riff = buf.subarray(0, 4).toString('ascii');
    const wave = buf.subarray(8, 12).toString('ascii');
    if (riff !== 'RIFF' || wave !== 'WAVE') {
      return { valid: false, reason: 'File extension is .wav but lacks RIFF/WAVE signature.' };
    }
  } else if (ext === '.mp3') {
    const id3 = buf.subarray(0, 3).toString('ascii') === 'ID3';
    const sync = buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
    if (!id3 && !sync) {
      return { valid: false, reason: 'File extension is .mp3 but lacks ID3 or MPEG audio frame signature.' };
    }
  } else if (ext === '.txt' || ext === '.csv') {
    if (buf.includes(0x00)) {
      return { valid: false, reason: 'Binary null bytes found inside text/CSV upload.' };
    }
  }

  return { valid: true };
}

export function decodeUploadContent(
  contentBase64: string | undefined,
  fallbackMeta: { fileName: string; title: string }
): { buffer: Buffer; hasRealBinary: boolean } {
  if (contentBase64 && contentBase64.trim().length > 0) {
    const stripped = contentBase64.includes(',')
      ? contentBase64.slice(contentBase64.indexOf(',') + 1)
      : contentBase64;
    return { buffer: Buffer.from(stripped.trim(), 'base64'), hasRealBinary: true };
  }
  const placeholder = `%PDF-1.4\n% HI-TECH College DMS Record Placeholder: ${fallbackMeta.title} (${fallbackMeta.fileName})\n`;
  return { buffer: Buffer.from(placeholder, 'utf8'), hasRealBinary: false };
}

export function validateAndScanUpload(params: {
  fileName: string;
  mimeType: string;
  declaredSizeBytes?: number;
  contentBase64?: string;
  maxSizeMb: number;
  allowedMimeTypes?: string[];
}): FileValidationResult {
  const safeName = sanitizeFileName(params.fileName);
  const ext = path.extname(safeName).toLowerCase();

  if (!ext || FORBIDDEN_EXTENSIONS.has(ext) || hasDoubleDangerousExtension(safeName)) {
    return {
      ok: false,
      error: `Security Quarantine: File "${safeName}" uses a prohibited or double executable extension.`,
      scanStatus: 'QUARANTINED',
      checksumSha256: '',
      byteLength: 0,
    };
  }

  if (!PERMITTED_DMS_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: `Unsupported file type (${ext}). Permitted formats: PDF, DOC/DOCX, XLS/XLSX/CSV, PPT/PPTX, JPG/PNG/WEBP, ZIP, MP4, MP3/WAV, TXT.`,
      scanStatus: 'QUARANTINED',
      checksumSha256: '',
      byteLength: 0,
    };
  }

  const maxBytes = Math.max(1, params.maxSizeMb) * 1024 * 1024;
  const { buffer, hasRealBinary } = decodeUploadContent(params.contentBase64, {
    fileName: safeName,
    title: safeName,
  });

  const effectiveSize = hasRealBinary
    ? buffer.byteLength
    : Number(params.declaredSizeBytes || buffer.byteLength);

  if (effectiveSize <= 0 || effectiveSize > maxBytes) {
    return {
      ok: false,
      error: `File size exceeds configured limit of ${params.maxSizeMb} MB for this module.`,
      scanStatus: 'QUARANTINED',
      checksumSha256: '',
      byteLength: effectiveSize,
    };
  }

  if (
    params.allowedMimeTypes &&
    params.allowedMimeTypes.length > 0 &&
    params.mimeType &&
    !params.allowedMimeTypes.includes(params.mimeType) &&
    params.mimeType !== 'application/octet-stream'
  ) {
    return {
      ok: false,
      error: `MIME type "${params.mimeType}" is not permitted for this document category.`,
      scanStatus: 'QUARANTINED',
      checksumSha256: '',
      byteLength: effectiveSize,
    };
  }

  if (hasRealBinary) {
    const magic = checkMagicBytes(ext, buffer);
    if (!magic.valid) {
      return {
        ok: false,
        error: `Security Quarantine: ${magic.reason}`,
        scanStatus: 'QUARANTINED',
        checksumSha256: '',
        byteLength: buffer.byteLength,
      };
    }
  }

  const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return {
    ok: true,
    scanStatus: 'VERIFIED_CLEAN',
    checksumSha256,
    byteLength: effectiveSize,
  };
}

export function savePrivateDocumentFile(params: {
  academicYear: string;
  moduleKey: string;
  fileName: string;
  contentBase64?: string;
  title: string;
}): { storagePath: string; checksumSha256: string; byteLength: number } {
  ensurePrivateStorageDir();
  const safeYear = String(params.academicYear || '2026').replace(/[^0-9A-Za-z_-]/g, '');
  const safeModule = String(params.moduleKey || 'GENERAL').replace(/[^0-9A-Za-z_-]/g, '');
  const safeName = sanitizeFileName(params.fileName);
  const relDir = path.join(safeYear, safeModule);
  const absDir = resolveSafeStoragePath(path.join(relDir, 'anchor')).replace(/[/\\]anchor$/, '');
  fs.mkdirSync(absDir, { recursive: true });

  const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;
  const relPath = path.join(relDir, uniqueName);
  const absPath = resolveSafeStoragePath(relPath);

  const { buffer } = decodeUploadContent(params.contentBase64, {
    fileName: safeName,
    title: params.title,
  });
  fs.writeFileSync(absPath, buffer);
  const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return {
    storagePath: relPath,
    checksumSha256,
    byteLength: buffer.byteLength,
  };
}

export function readPrivateDocumentFile(relativeStoragePath: string): Buffer | null {
  try {
    const absPath = resolveSafeStoragePath(relativeStoragePath);
    if (!fs.existsSync(absPath)) return null;
    return fs.readFileSync(absPath);
  } catch {
    return null;
  }
}

export interface SignedDownloadPayload {
  docId: string;
  attachmentId?: string;
  version?: number;
  userId: string;
  exp: number;
}

export function signDownloadToken(
  payload: Omit<SignedDownloadPayload, 'exp'>,
  ttlSeconds = 300
): { token: string; expiresAt: string } {
  const exp = Date.now() + Math.max(30, Math.min(3600, ttlSeconds)) * 1000;
  const fullPayload: SignedDownloadPayload = { ...payload, exp };
  const b64 = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', DOWNLOAD_TOKEN_SECRET)
    .update(b64)
    .digest('base64url');
  return {
    token: `${b64}.${sig}`,
    expiresAt: new Date(exp).toISOString(),
  };
}

export function verifyDownloadToken(token: string | undefined): SignedDownloadPayload | null {
  if (!token || !token.includes('.')) return null;
  const [b64, sig] = token.split('.', 2);
  if (!b64 || !sig) return null;
  const expected = crypto
    .createHmac('sha256', DOWNLOAD_TOKEN_SECRET)
    .update(b64)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as SignedDownloadPayload;
    if (!parsed.exp || parsed.exp <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
