import React from 'react';
import { ArrowDown, ArrowUp, Calculator, Check, Code2, Cpu, FileText, Paperclip, Trash2, UploadCloud } from 'lucide-react';
import {
  CandidateQuestionSnapshot,
  CandidateResponseValue,
} from '../../../types/examAssessment';
import { evaluateSafeMathExpression } from '../../../services/examAssessmentService';

interface Props {
  question: CandidateQuestionSnapshot;
  value: CandidateResponseValue | undefined;
  onChange: (next: CandidateResponseValue) => void;
  disabled?: boolean;
}

export default function QuestionRunnerWidget({ question, value, onChange, disabled }: Props) {
  const handleToggleMulti = (opt: string) => {
    const current = Array.isArray(value) ? (value as string[]) : [];
    const next = current.includes(opt) ? current.filter((x) => x !== opt) : [...current, opt];
    onChange(next);
  };

  const handleOrderMove = (idx: number, delta: -1 | 1) => {
    const base = Array.isArray(value)
      ? [...(value as string[])]
      : [...(question.orderingItemsShuffled ?? [])];
    const target = idx + delta;
    if (target < 0 || target >= base.length) return;
    [base[idx], base[target]] = [base[target], base[idx]];
    onChange(base);
  };

  if (question.kind === 'MCQ_SINGLE' || question.kind === 'TRUE_FALSE_UNCERTAIN') {
    const selected = typeof value === 'string' ? value : '';
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(question.options ?? []).map((opt, idx) => {
          const isPicked = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              className={`p-3.5 rounded-xl border text-left text-sm transition flex items-center justify-between gap-3 ${
                isPicked
                  ? 'border-[#092c60] bg-[#092c60] text-white font-semibold'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className={`font-mono text-xs tabular-nums ${isPicked ? 'text-amber-300' : 'text-slate-600'}`}>
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span>{opt}</span>
              </span>
              {isPicked && <Check size={16} className="shrink-0 text-amber-300" />}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.kind === 'MCQ_MULTI') {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-2.5">
        <p className="text-xs text-slate-500">Select all matching options. Partial credit applies with wrong-selection penalty.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(question.options ?? []).map((opt) => {
            const isPicked = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => handleToggleMulti(opt)}
                className={`p-3.5 rounded-xl border text-left text-sm transition flex items-center gap-3 ${
                  isPicked
                    ? 'border-[#0875e8] bg-blue-50 text-[#092c60] font-semibold'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isPicked ? 'bg-[#0875e8] border-[#0875e8] text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isPicked && <Check size={12} />}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.kind === 'FILL_BLANK_EXACT' || question.kind === 'FILL_BLANK_FUZZY' || question.kind === 'NUMERIC_TOLERANCE') {
    const textVal = typeof value === 'string' ? value : '';
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-600 block">
          {question.kind === 'NUMERIC_TOLERANCE'
            ? 'Numeric response (calculated value within approved percentage tolerance):'
            : question.kind === 'FILL_BLANK_FUZZY'
            ? 'Short text response (fuzzy synonym & spelling tolerance enabled):'
            : 'Exact text response:'}
        </label>
        <input
          type={question.kind === 'NUMERIC_TOLERANCE' ? 'number' : 'text'}
          step="any"
          disabled={disabled}
          value={textVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.kind === 'NUMERIC_TOLERANCE' ? 'Enter numeric value (e.g. 8.33)' : 'Type your answer here...'}
          className="w-full max-w-lg px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl focus:border-[#0875e8] focus:ring-2 focus:ring-[#0875e8]/25"
        />
      </div>
    );
  }

  if (question.kind === 'DROPDOWN_CLOZE') {
    const current = Array.isArray(value) ? [...(value as string[])] : [];
    const segments = question.passageSegments ?? [];
    const choices = question.clozeChoices ?? [];
    return (
      <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 leading-loose">
        {segments.map((seg, idx) => (
          <React.Fragment key={idx}>
            <span>{seg}</span>
            {idx < choices.length && (
              <select
                disabled={disabled}
                value={current[idx] ?? ''}
                onChange={(e) => {
                  const next = [...current];
                  next[idx] = e.target.value;
                  onChange(next);
                }}
                aria-label={`Blank ${idx + 1}`}
                className="mx-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-[#092c60]"
              >
                <option value="">-- Select option --</option>
                {choices[idx].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (question.kind === 'MATCHING') {
    const map = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<string, string>;
    const lefts = question.matchingLefts ?? [];
    const rights = question.matchingRightsShuffled ?? [];
    return (
      <div className="space-y-3">
        {lefts.map((leftItem) => (
          <div
            key={leftItem}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-xl"
          >
            <span className="text-sm font-medium text-slate-900">{leftItem}</span>
            <select
              disabled={disabled}
              value={map[leftItem] ?? ''}
              onChange={(e) => onChange({ ...map, [leftItem]: e.target.value })}
              aria-label={`Match for ${leftItem}`}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 sm:min-w-[280px]"
            >
              <option value="">-- Choose matching trade-off --</option>
              {rights.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  if (question.kind === 'ORDERING') {
    const list = Array.isArray(value)
      ? (value as string[])
      : (question.orderingItemsShuffled ?? []);
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Arrange steps in exact execution sequence using the Up / Down controls:</p>
        {list.map((step, idx) => (
          <div
            key={step}
            className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl"
          >
            <div className="flex items-center gap-3 text-sm text-slate-800">
              <span className="font-mono text-xs text-slate-600 tabular-nums w-6">{idx + 1}.</span>
              <span>{step}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={disabled || idx === 0}
                onClick={() => handleOrderMove(idx, -1)}
                aria-label="Move step up"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={disabled || idx === list.length - 1}
                onClick={() => handleOrderMove(idx, 1)}
                aria-label="Move step down"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (question.kind === 'FORMULA_SAFE') {
    const expr = typeof value === 'string' ? value : '';
    const vars = question.formulaVariables ?? {};
    const evalPreview = expr.trim() ? evaluateSafeMathExpression(expr, vars) : null;
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <Calculator size={14} className="text-[#0875e8]" />
          <span>Safe expression evaluator (no arbitrary code execution) · Allowed variables:</span>
          <span className="font-mono text-slate-900">
            {Object.entries(vars)
              .map(([k, v]) => `${k} = ${v}`)
              .join(', ') || 'Numeric literals'}
          </span>
        </div>
        <input
          type="text"
          disabled={disabled}
          value={expr}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: 2^(h + 1) - 1"
          className="w-full max-w-lg px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-xl focus:border-[#0875e8] focus:ring-2 focus:ring-[#0875e8]/25"
        />
        {evalPreview && (
          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border inline-block ${
              evalPreview.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {evalPreview.ok
              ? `Evaluates cleanly for preview variables -> ${evalPreview.value}`
              : `Syntax check: ${evalPreview.error}`}
          </div>
        )}
      </div>
    );
  }

  if (question.kind === 'HOTSPOT_GRID') {
    const picked =
      value && typeof value === 'object' && 'row' in value
        ? (value as { row: number; col: number })
        : null;
    const hardwareLabels: Record<string, string> = {
      '1-1': 'CPU Core L1/L2',
      '1-2': 'MMU & TLB',
      '1-3': 'RAM Controller',
      '1-4': 'BIOS Flash',
      '2-1': 'IRQ Controller',
      '2-2': 'PCIe Root Hub',
      '2-3': 'DMA Bus Master',
      '2-4': 'SATA / NVMe Port',
      '3-1': 'USB Host',
      '3-2': 'Audio Codec',
      '3-3': 'NIC Ethernet',
      '3-4': 'Display Bus',
    };
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Cpu size={14} className="text-[#0875e8]" />
          <span>Interactive Hardware Schematic — Click the target subsystem module:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl p-3 bg-slate-900 rounded-xl border border-slate-800">
          {[1, 2, 3].map((row) =>
            [1, 2, 3, 4].map((col) => {
              const key = `${row}-${col}`;
              const selected = picked?.row === row && picked?.col === col;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ row, col })}
                  className={`p-3 rounded-lg border text-left transition ${
                    selected
                      ? 'bg-[#0875e8] border-blue-300 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <span className={`block font-mono text-[10px] tabular-nums ${selected ? 'text-blue-100' : 'text-slate-300'}`}>
                    R{row}·C{col}
                  </span>
                  <span className="block text-xs font-medium mt-0.5">{hardwareLabels[key]}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (question.kind === 'CODE_SANDBOX' || question.kind === 'SQL_SANDBOX') {
    const code = typeof value === 'string' ? value : question.starterCode ?? '';
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Code2 size={14} className="text-[#092c60]" />
          <span>{question.kind === 'SQL_SANDBOX' ? 'SQL Query Editor' : 'Code Implementation Sandbox'}</span>
        </div>
        <textarea
          rows={7}
          disabled={disabled}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3.5 font-mono text-xs bg-slate-950 text-emerald-300 border border-slate-800 rounded-xl focus:border-[#0875e8] focus:ring-2 focus:ring-[#0875e8]/30"
        />
      </div>
    );
  }

  if (question.kind === 'PRACTICAL_CHECKLIST') {
    const steps = question.checklistSteps ?? [];
    const checked = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-2.5">
        <p className="text-xs text-slate-500">
          Record completion notes / confirm practical steps performed (verified by human assessor):
        </p>
        {steps.map((step) => {
          const done = checked.includes(step);
          return (
            <button
              key={step}
              type="button"
              disabled={disabled}
              onClick={() => handleToggleMulti(step)}
              className={`w-full p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition ${
                done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                }`}
              >
                {done && <Check size={12} />}
              </span>
              <span>{step}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.kind === 'FILE_UPLOAD') {
    const record: Record<string, string> =
      value && typeof value === 'object' && !Array.isArray(value) && !('row' in value)
        ? (value as Record<string, string>)
        : typeof value === 'string' && value.trim().length > 0
        ? { fileName: '', fileSize: '', mimeType: '', notes: value }
        : { fileName: '', fileSize: '', mimeType: '', notes: '' };

    const fileName = record.fileName ?? '';
    const fileSize = record.fileSize ?? '';
    const mimeType = record.mimeType ?? '';
    const notes = record.notes ?? '';
    const inputId = `exam-file-upload-${question.questionId}`;

    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
      <div className="space-y-3.5">
        <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <UploadCloud size={18} className="text-[#0875e8] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Attach Assessment Submission File
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Supported formats: PDF, Word, Text, ZIP, Images, SQL, Python, TypeScript
                </p>
              </div>
            </div>
            <label
              htmlFor={inputId}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition border ${
                disabled
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-[#092c60] text-white border-[#092c60] hover:bg-[#0b387a] cursor-pointer focus-within:ring-2 focus-within:ring-[#0875e8]/40'
              }`}
            >
              <Paperclip size={14} />
              <span>{fileName ? 'Replace File' : 'Choose File'}</span>
              <input
                id={inputId}
                type="file"
                disabled={disabled}
                accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg,.sql,.py,.ts"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  onChange({
                    fileName: file.name,
                    fileSize: formatBytes(file.size),
                    mimeType: file.type || 'application/octet-stream',
                    notes,
                  });
                }}
              />
            </label>
          </div>

          {fileName && (
            <div className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <Paperclip size={15} className="text-emerald-700 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{fileName}</p>
                  <p className="text-[11px] text-slate-600 font-mono">
                    {[fileSize, mimeType].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    fileName: '',
                    fileSize: '',
                    mimeType: '',
                    notes,
                  })
                }
                aria-label="Remove attached file"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-40 shrink-0"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${inputId}-notes`} className="block text-xs font-medium text-slate-700">
            Submission Notes &amp; File Manifest (Optional)
          </label>
          <textarea
            id={`${inputId}-notes`}
            rows={4}
            disabled={disabled}
            value={notes}
            onChange={(e) =>
              onChange({
                fileName,
                fileSize,
                mimeType,
                notes: e.target.value,
              })
            }
            placeholder="Describe what your attached file contains, environment versions, or instructions for the assessor..."
            className="w-full p-3.5 text-sm bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-[#0875e8] focus:ring-2 focus:ring-[#0875e8]/25"
          />
        </div>

        {question.rubricCriteria && question.rubricCriteria.length > 0 && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
              <FileText size={14} className="text-[#092c60]" />
              <span>Grading Rubric Breakdown (Marked Anonymously)</span>
            </div>
            <div className="space-y-1.5">
              {question.rubricCriteria.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-4 text-xs text-slate-600">
                  <span>
                    <strong className="text-slate-800">{c.label}:</strong> {c.description}
                  </span>
                  <span className="font-mono tabular-nums text-slate-700 shrink-0">{c.maxMarks} marks</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // SHORT_ANSWER / ESSAY_RUBRIC default rich text area + Rubric transparency
  const textAns = typeof value === 'string' ? value : '';
  return (
    <div className="space-y-3">
      <textarea
        rows={question.kind === 'SHORT_ANSWER' ? 4 : 7}
        disabled={disabled}
        value={textAns}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your clear, structured academic response..."
        className="w-full p-3.5 text-sm bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-[#0875e8] focus:ring-2 focus:ring-[#0875e8]/25"
      />
      {question.rubricCriteria && question.rubricCriteria.length > 0 && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
            <FileText size={14} className="text-[#092c60]" />
            <span>Grading Rubric Breakdown (Marked Anonymously)</span>
          </div>
          <div className="space-y-1.5">
            {question.rubricCriteria.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-4 text-xs text-slate-600">
                <span>
                  <strong className="text-slate-800">{c.label}:</strong> {c.description}
                </span>
                <span className="font-mono tabular-nums text-slate-700 shrink-0">{c.maxMarks} marks</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
