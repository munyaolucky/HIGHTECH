import { useMemo, useState } from 'react';
import {
  FileDown,
  FileText,
  Printer,
  QrCode,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import type { StaffUserAccount } from '../../config/staff-navigation';
import { StaffButton } from '../staff/components/StaffDashboardUI';

import {
  DMS_CATEGORY_CATALOG,
  type DocumentCategory,
  type DocumentConfidentiality,
} from './dmsCatalog';

export type { DocumentCategory, DocumentConfidentiality };

export interface DocumentDesignConfig {
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSizePt: number;
  accentColor: 'navy' | 'academic-blue' | 'gold' | 'crimson';
  alignment: 'left' | 'justify';
  showWatermark: boolean;
  watermarkText: string;
  showHeader: boolean;
  showFooter: boolean;
  showSignatureBlock: boolean;
  showQrBlock: boolean;
}

export interface DocumentTemplateItem {
  id: string;
  code: string;
  name: string;
  category: DocumentCategory;
  defaultConfidentiality: DocumentConfidentiality;
  description: string;
  subjectTemplate: string;
  bodyTemplate: string;
  defaultFields: Record<string, string>;
  design: DocumentDesignConfig;
}

export interface DesignerDraftPayload {
  id?: string;
  referenceNumber?: string | null;
  status?: string;
  title: string;
  category: DocumentCategory;
  confidentiality: DocumentConfidentiality;
  recipientLabel: string;
  subjectLine: string;
  bodyContent: string;
  metadataFields: Record<string, string>;
  design: DocumentDesignConfig;
  templateId: string | null;
  verificationHash?: string | null;
  signatures?: {
    signerName: string;
    signerTitle: string;
    signedAt: string;
    signatureDigest: string;
  }[];
}

const ACCENT_BORDER: Record<DocumentDesignConfig['accentColor'], string> = {
  navy: 'border-[#102D50]',
  'academic-blue': 'border-[#1769AA]',
  gold: 'border-[#C69228]',
  crimson: 'border-[#991B1B]',
};

const ACCENT_BG: Record<DocumentDesignConfig['accentColor'], string> = {
  navy: 'bg-[#102D50] text-white',
  'academic-blue': 'bg-[#1769AA] text-white',
  gold: 'bg-[#E8B44A] text-[#102D50]',
  crimson: 'bg-red-800 text-white',
};

const ACCENT_TEXT: Record<DocumentDesignConfig['accentColor'], string> = {
  navy: 'text-[#102D50]',
  'academic-blue': 'text-[#1769AA]',
  gold: 'text-[#9A6E14]',
  crimson: 'text-red-800',
};

const FONT_CLASS: Record<DocumentDesignConfig['fontFamily'], string> = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono',
};

const SIZE_CLASS: Record<number, string> = {
  10: 'text-[13px] leading-relaxed',
  11: 'text-[14px] leading-relaxed',
  12: 'text-[15px] leading-relaxed',
  13: 'text-[16px] leading-relaxed',
};

function interpolate(template: string, fields: Record<string, string>, recipientLabel: string): string {
  let out = template.replaceAll('{{recipientName}}', recipientLabel || 'Recipient');
  for (const [key, val] of Object.entries(fields)) {
    out = out.replaceAll(`{{${key}}}`, val || `[${key}]`);
  }
  return out;
}

function DeterministicQrSvg({ seed }: { seed: string }) {
  // Deterministic 11x11 matrix for visual QR verification stamp without external calls
  const cells: boolean[] = [];
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let r = 0; r < 11; r += 1) {
    for (let c = 0; c < 11; c += 1) {
      const inFinder =
        (r < 3 && c < 3) || (r < 3 && c >= 8) || (r >= 8 && c < 3);
      if (inFinder) {
        cells.push(true);
      } else {
        const bit = ((hash >>> ((r * 11 + c) % 24)) ^ (r * 7 + c * 3)) & 1;
        cells.push(bit === 1);
      }
    }
  }

  return (
    <svg
      viewBox="0 0 11 11"
      className="h-16 w-16 border border-slate-300 bg-white p-1"
      aria-label="Document verification QR matrix"
    >
      {cells.map((filled, idx) =>
        filled ? (
          <rect
            key={idx}
            x={idx % 11}
            y={Math.floor(idx / 11)}
            width={1}
            height={1}
            fill="#102D50"
          />
        ) : null
      )}
    </svg>
  );
}

export default function DocumentDesigner({
  user,
  templates,
  initialDoc,
  saving,
  onSaveDraft,
  onSaveAndSubmit,
  onCancel,
}: {
  user: StaffUserAccount;
  templates: DocumentTemplateItem[];
  initialDoc?: DesignerDraftPayload | null;
  saving?: boolean;
  onSaveDraft: (payload: DesignerDraftPayload) => Promise<void>;
  onSaveAndSubmit?: (payload: DesignerDraftPayload) => Promise<void>;
  onCancel?: () => void;
}) {
  const defaultTemplate = templates[0] ?? null;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialDoc?.templateId ?? defaultTemplate?.id ?? ''
  );
  const [title, setTitle] = useState(
    initialDoc?.title ?? defaultTemplate?.name ?? 'Official HI-TECH College Document'
  );
  const [category, setCategory] = useState<DocumentCategory>(
    initialDoc?.category ?? defaultTemplate?.category ?? 'OFFICIAL_MEMO'
  );
  const [confidentiality, setConfidentiality] = useState<DocumentConfidentiality>(
    initialDoc?.confidentiality ?? defaultTemplate?.defaultConfidentiality ?? 'INTERNAL'
  );
  const [recipientLabel, setRecipientLabel] = useState(
    initialDoc?.recipientLabel ?? 'Brian Kiprop Mutai'
  );
  const [fields, setFields] = useState<Record<string, string>>(
    initialDoc?.metadataFields ?? defaultTemplate?.defaultFields ?? {}
  );
  const [subjectLine, setSubjectLine] = useState(
    initialDoc?.subjectLine ??
      (defaultTemplate
        ? interpolate(
            defaultTemplate.subjectTemplate,
            defaultTemplate.defaultFields,
            'Brian Kiprop Mutai'
          )
        : 'OFFICIAL COMMUNICATION')
  );
  const [bodyContent, setBodyContent] = useState(
    initialDoc?.bodyContent ??
      (defaultTemplate
        ? interpolate(
            defaultTemplate.bodyTemplate,
            defaultTemplate.defaultFields,
            'Brian Kiprop Mutai'
          )
        : 'Enter official institutional correspondence here.')
  );
  const [design, setDesign] = useState<DocumentDesignConfig>(
    initialDoc?.design ??
      defaultTemplate?.design ?? {
        fontFamily: 'serif',
        fontSizePt: 11,
        accentColor: 'navy',
        alignment: 'left',
        showWatermark: false,
        watermarkText: 'HI-TECH COLLEGE',
        showHeader: true,
        showFooter: true,
        showSignatureBlock: true,
        showQrBlock: true,
      }
  );
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldVal, setNewFieldVal] = useState('');

  const applyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    setTitle(`${tpl.name} — ${recipientLabel}`);
    setCategory(tpl.category);
    setConfidentiality(tpl.defaultConfidentiality);
    setFields({ ...tpl.defaultFields });
    setSubjectLine(interpolate(tpl.subjectTemplate, tpl.defaultFields, recipientLabel));
    setBodyContent(interpolate(tpl.bodyTemplate, tpl.defaultFields, recipientLabel));
    setDesign({ ...tpl.design });
  };

  const reinterpolateFromActiveTemplate = (
    nextFields: Record<string, string>,
    nextRecipient: string
  ) => {
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tpl) return;
    setSubjectLine(interpolate(tpl.subjectTemplate, nextFields, nextRecipient));
    setBodyContent(interpolate(tpl.bodyTemplate, nextFields, nextRecipient));
  };

  const payload: DesignerDraftPayload = useMemo(
    () => ({
      id: initialDoc?.id,
      referenceNumber: initialDoc?.referenceNumber,
      status: initialDoc?.status,
      title,
      category,
      confidentiality,
      recipientLabel,
      subjectLine,
      bodyContent,
      metadataFields: fields,
      design,
      templateId: selectedTemplateId || null,
    }),
    [
      initialDoc,
      title,
      category,
      confidentiality,
      recipientLabel,
      subjectLine,
      bodyContent,
      fields,
      design,
      selectedTemplateId,
    ]
  );

  const exportWordDoc = () => {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: Georgia, serif; padding: 36px; color: #102D50;">
  ${
    design.showHeader
      ? `<div style="border-bottom: 3px solid #102D50; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="margin:0; font-size: 20px;">HI-TECH COLLEGE</h1>
          <p style="margin:4px 0 0; font-size: 12px;">${user.campus} · Office of ${user.department}</p>
        </div>`
      : ''
  }
  <p><strong>Reference:</strong> ${initialDoc?.referenceNumber ?? 'DRAFT (Pending Official Issuance)'}</p>
  <p><strong>Recipient:</strong> ${recipientLabel}</p>
  <h2 style="font-size: 15px; text-transform: uppercase;">${subjectLine}</h2>
  <div style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${bodyContent}</div>
  ${
    design.showFooter
      ? `<hr style="margin-top:32px;" /><p style="font-size: 11px; color: #475569;">HI-TECH College · TVETA Accredited Institution · Confidential Notice: ${confidentiality}</p>`
      : ''
  }
</body>
</html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(initialDoc?.referenceNumber ?? title).replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const accentBorder = ACCENT_BORDER[design.accentColor];
  const accentBg = ACCENT_BG[design.accentColor];
  const accentText = ACCENT_TEXT[design.accentColor];
  const fontCls = FONT_CLASS[design.fontFamily];
  const sizeCls = SIZE_CLASS[design.fontSizePt] ?? SIZE_CLASS[11];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-[#eef4fd] dark:bg-slate-800 p-2 text-[#1769AA] dark:text-blue-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#102D50] dark:text-white">
              Official Template-Based A4 Document Designer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an institutional template, edit structured fields, customize typography, and preview live A4 layout.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onCancel && (
            <StaffButton variant="secondary" onClick={onCancel}>
              Back to Register
            </StaffButton>
          )}
          <StaffButton variant="secondary" onClick={() => window.print()}>
            <Printer size={15} /> Print / PDF
          </StaffButton>
          <StaffButton variant="secondary" onClick={exportWordDoc}>
            <FileDown size={15} /> Word (.doc)
          </StaffButton>
          <StaffButton disabled={saving} onClick={() => onSaveDraft(payload)}>
            <Save size={15} /> {initialDoc?.id ? 'Save Revision' : 'Save Draft'}
          </StaffButton>
          {onSaveAndSubmit && (!initialDoc?.id || initialDoc.status === 'DRAFT' || initialDoc.status === 'CHANGES_REQUESTED') && (
            <StaffButton
              variant="success"
              disabled={saving}
              onClick={() => onSaveAndSubmit(payload)}
            >
              <Send size={15} /> Save &amp; Submit
            </StaffButton>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr] items-start">
        {/* Left Controls Panel */}
        <section className="no-print rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Institutional Template
              <select
                value={selectedTemplateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
              >
                <option value="">Custom Blank Letterhead</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} · {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Document Title (Registry Index)
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                {DMS_CATEGORY_CATALOG.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Confidentiality Level
              <select
                value={confidentiality}
                onChange={(e) => setConfidentiality(e.target.value as DocumentConfidentiality)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="INTERNAL">INTERNAL</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="RESTRICTED">RESTRICTED</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Recipient / Addressee Name
            <input
              type="text"
              value={recipientLabel}
              onChange={(e) => {
                const next = e.target.value;
                setRecipientLabel(next);
                reinterpolateFromActiveTemplate(fields, next);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </label>

          {/* Dynamic Template Placeholder Fields */}
          <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
            <div className="text-xs font-bold text-[#102D50] dark:text-white flex items-center gap-1.5">
              <FileText size={14} /> Template Data Fields
            </div>
            {Object.entries(fields).map(([key, val]) => (
              <label
                key={key}
                className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300"
              >
                {key}
                <input
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const updated = { ...fields, [key]: e.target.value };
                    setFields(updated);
                    reinterpolateFromActiveTemplate(updated, recipientLabel);
                  }}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </label>
            ))}

            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                placeholder="Field key"
                className="w-1/3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              />
              <input
                type="text"
                value={newFieldVal}
                onChange={(e) => setNewFieldVal(e.target.value)}
                placeholder="Field value"
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newFieldKey.trim()) return;
                  const updated = { ...fields, [newFieldKey.trim()]: newFieldVal };
                  setFields(updated);
                  setNewFieldKey('');
                  setNewFieldVal('');
                }}
                className="rounded-lg bg-[#1769AA] px-2.5 py-1 text-xs font-semibold text-white"
              >
                Add
              </button>
            </div>
          </div>

          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Subject Heading
            <input
              type="text"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Document Body Content
            <textarea
              rows={7}
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
            />
          </label>

          {/* Formatting & Branding Controls */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="text-xs font-bold text-[#102D50] dark:text-white">
              Typography &amp; Layout Controls
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Font Family
                <select
                  value={design.fontFamily}
                  onChange={(e) =>
                    setDesign((d) => ({
                      ...d,
                      fontFamily: e.target.value as DocumentDesignConfig['fontFamily'],
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs"
                >
                  <option value="serif">Formal Serif</option>
                  <option value="sans">Modern Sans</option>
                  <option value="mono">Monospace</option>
                </select>
              </label>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Accent Palette
                <select
                  value={design.accentColor}
                  onChange={(e) =>
                    setDesign((d) => ({
                      ...d,
                      accentColor: e.target.value as DocumentDesignConfig['accentColor'],
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs"
                >
                  <option value="navy">Deep Navy</option>
                  <option value="academic-blue">Academic Blue</option>
                  <option value="gold">Heritage Gold</option>
                  <option value="crimson">Restricted Crimson</option>
                </select>
              </label>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Text Size
                <select
                  value={design.fontSizePt}
                  onChange={(e) =>
                    setDesign((d) => ({ ...d, fontSizePt: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs"
                >
                  <option value={10}>10 pt (Compact)</option>
                  <option value={11}>11 pt (Standard)</option>
                  <option value={12}>12 pt (Readable)</option>
                  <option value={13}>13 pt (Large)</option>
                </select>
              </label>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Alignment
                <select
                  value={design.alignment}
                  onChange={(e) =>
                    setDesign((d) => ({
                      ...d,
                      alignment: e.target.value as DocumentDesignConfig['alignment'],
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs"
                >
                  <option value="left">Left Aligned</option>
                  <option value="justify">Justified</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {(
                [
                  ['showHeader', 'College Letterhead'],
                  ['showFooter', 'Official Footer'],
                  ['showSignatureBlock', 'Signature Block'],
                  ['showQrBlock', 'QR Verification'],
                  ['showWatermark', 'Watermark Stamp'],
                ] as const
              ).map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={design[field]}
                    onChange={(e) =>
                      setDesign((d) => ({ ...d, [field]: e.target.checked }))
                    }
                    className="accent-[#1769AA]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {design.showWatermark && (
              <input
                type="text"
                value={design.watermarkText}
                onChange={(e) =>
                  setDesign((d) => ({ ...d, watermarkText: e.target.value }))
                }
                placeholder="Watermark label..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
              />
            )}
          </div>
        </section>

        {/* Right Live A4 Preview Sheet */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-200/70 dark:bg-slate-950 p-4 sm:p-8 overflow-x-auto">
          <div
            className={`print-container relative mx-auto w-full max-w-[794px] min-h-[1040px] bg-white text-slate-900 shadow-lg border border-slate-300 p-8 sm:p-12 flex flex-col justify-between ${fontCls}`}
          >
            {design.showWatermark && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <span className="-rotate-35 select-none text-5xl sm:text-6xl font-black tracking-widest text-slate-200/60 uppercase">
                  {design.watermarkText}
                </span>
              </div>
            )}

            <div className="relative z-10 space-y-6">
              {design.showHeader && (
                <header className={`border-b-4 ${accentBorder} pb-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-base font-black ${accentBg}`}
                      >
                        HC
                      </div>
                      <div>
                        <div className={`text-xl font-black tracking-tight ${accentText}`}>
                          HI-TECH COLLEGE
                        </div>
                        <div className="text-xs font-semibold text-slate-600">
                          TVETA Accredited Higher &amp; Technical Education Institution
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {user.campus} · {user.department} · P.O. Box 40210-00100, Nairobi
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="font-mono font-bold text-[#102D50]">
                        {initialDoc?.referenceNumber ?? 'DRAFT · UNISSUED'}
                      </div>
                      <div className="text-slate-500">
                        Date: {new Date().toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                      </div>
                      <div className="mt-1 inline-block rounded border border-slate-300 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                        {confidentiality}
                      </div>
                    </div>
                  </div>
                </header>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Addressed To: </span>
                  <span>{recipientLabel}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  Category: {category.replaceAll('_', ' ')}
                </div>
              </div>

              <h1
                className={`border-l-4 ${accentBorder} pl-3 text-base font-extrabold uppercase tracking-wide ${accentText}`}
              >
                {subjectLine}
              </h1>

              {Object.keys(fields).length > 0 && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
                  {Object.entries(fields).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-200/70 pb-1">
                      <span className="font-semibold text-slate-500 capitalize">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-medium text-slate-900 text-right">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`whitespace-pre-wrap text-slate-800 ${sizeCls} ${
                  design.alignment === 'justify' ? 'text-justify' : 'text-left'
                }`}
              >
                {bodyContent}
              </div>
            </div>

            <div className="relative z-10 mt-10 space-y-6">
              {(design.showSignatureBlock || design.showQrBlock) && (
                <div className="flex flex-wrap items-end justify-between gap-6 border-t border-slate-200 pt-6">
                  {design.showSignatureBlock ? (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase">
                        Authorized Signatory &amp; Institutional Seal
                      </div>
                      {initialDoc?.signatures && initialDoc.signatures.length > 0 ? (
                        <div className="space-y-1">
                          {initialDoc.signatures.map((sig, i) => (
                            <div key={i} className="text-xs">
                              <div className="font-bold text-[#102D50]">{sig.signerName}</div>
                              <div className="text-slate-600">{sig.signerTitle}</div>
                              <div className="font-mono text-[10px] text-emerald-700">
                                Signed: {sig.signatureDigest} · {sig.signedAt.slice(0, 10)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-4">
                          <div className="w-56 border-b border-slate-400" />
                          <div className="mt-1 text-xs font-bold text-slate-800">
                            {user.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">{user.roleTitle}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div />
                  )}

                  {design.showQrBlock && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <DeterministicQrSvg
                        seed={
                          initialDoc?.referenceNumber ??
                          initialDoc?.verificationHash ??
                          `${title}:${recipientLabel}`
                        }
                      />
                      <div className="text-[10px] text-slate-600 max-w-[160px]">
                        <div className="flex items-center gap-1 font-bold text-[#102D50]">
                          <QrCode size={12} /> Authenticity Check
                        </div>
                        <div className="mt-0.5 font-mono text-[10px]">
                          {initialDoc?.verificationHash ?? 'Pending Official Issuance'}
                        </div>
                        <div className="mt-0.5">
                          Verify via HI-TECH College Document Portal
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {design.showFooter && (
                <footer className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                  <span>
                    HI-TECH College · Kenya TVETA Accredited · All campuses connected
                  </span>
                  <span className="font-mono">
                    {initialDoc?.referenceNumber ?? 'UNISSUED DRAFT'} · Generated by {user.employeeNumber}
                  </span>
                </footer>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
