import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { lecturerApi } from "../services/lecturerApi";

interface QuestionEditorProps {
  onBack: () => void;
  onQuestionSaved: () => void;
}

export default function QuestionEditor({ onBack, onQuestionSaved }: QuestionEditorProps) {
  const assignments = lecturerApi.getAssignments();

  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || "");
  const [unitCode, setUnitCode] = useState(assignments[0]?.unitId || "CSC 301");
  const [type, setType] = useState("MCQ_SINGLE");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [instructions, setInstructions] = useState("Select the single best answer.");
  const [topic, setTopic] = useState("");
  const [marks, setMarks] = useState(2);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "ADVANCED">("MEDIUM");
  const [explanation, setExplanation] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Choice options state
  const [options, setOptions] = useState([
    { id: "opt-1", text: "Option A" },
    { id: "opt-2", text: "Option B" },
    { id: "opt-3", text: "Option C" },
    { id: "opt-4", text: "Option D" },
  ]);
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>(["opt-1"]);
  const [expectedAnswer, setExpectedAnswer] = useState("true");

  const isChoice = type === "MCQ_SINGLE" || type === "MCQ_MULTIPLE";
  const isBoolean = type === "TRUE_FALSE";
  const isText = type === "SHORT_ANSWER" || type === "LONG_ANSWER";
  const isNumeric = type === "NUMERIC";

  const addOption = () => {
    const nextId = "opt-" + (options.length + 1);
    setOptions([...options, { id: nextId, text: `Option ${String.fromCharCode(65 + options.length)}` }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
    setCorrectOptionIds(correctOptionIds.filter((cid) => cid !== id));
  };

  const updateOptionText = (id: string, text: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const toggleCorrectOption = (id: string) => {
    if (type === "MCQ_SINGLE") {
      setCorrectOptionIds([id]);
    } else {
      setCorrectOptionIds(
        correctOptionIds.includes(id)
          ? correctOptionIds.filter((item) => item !== id)
          : [...correctOptionIds, id]
      );
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!title.trim() || !prompt.trim()) {
      setMessage("Question title and question content are required.");
      return;
    }

    if (isChoice && correctOptionIds.length === 0) {
      setMessage("Select at least one correct answer option.");
      return;
    }

    if (isChoice && options.some((o) => !o.text.trim())) {
      setMessage("All options must contain valid text.");
      return;
    }

    setSaving(true);

    try {
      let answerConfig: Record<string, unknown> = {};
      if (isChoice) {
        answerConfig = { correctOptionIds };
      } else if (isBoolean) {
        answerConfig = { correctAnswer: expectedAnswer };
      } else if (isText || isNumeric) {
        answerConfig = { acceptedAnswers: [expectedAnswer] };
      }

      lecturerApi.createQuestion({
        assignmentId,
        unitCode,
        title: title.trim(),
        prompt: prompt.trim(),
        instructions: instructions.trim(),
        topic: topic.trim() || "General",
        type,
        marks: Number(marks),
        difficulty,
        options: isChoice ? options : undefined,
        answerConfig,
        explanation: explanation.trim(),
        status: "DRAFT",
      });

      setMessage("Question successfully saved into institutional question bank.");
      setTimeout(() => {
        onQuestionSaved();
      }, 1200);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="secondary-button py-1.5 px-3">
            <ArrowLeft size={15} /> Back
          </button>
          <div>
            <span className="eyebrow">QUESTION BANK BUILDER</span>
            <h1>Create Examination Question</h1>
            <p>Draft reusable questions, configure options, difficulty, marks, and model grading solutions.</p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.includes("success")
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.includes("success") ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="editor-layout">
        {/* MAIN EDITOR FORM */}
        <div className="editor-main space-y-4">
          <div>
            <label>Question Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Asymptotic Complexity of Red-Black Tree Search"
              required
            />
          </div>

          <div>
            <label>Question Instructions (Shown to Candidate)</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Select the single best answer."
            />
          </div>

          <div>
            <label>Question Content / Prompt Statement</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter full question formulation, problem premise, or algorithmic scenario..."
              required
            />
          </div>

          {/* DYNAMIC ANSWER CONFIGURATION */}
          {isChoice && (
            <div className="editor-subsection space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Answer Options Configuration
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {type === "MCQ_SINGLE" ? "Select the radio button for the single correct answer." : "Select checkboxes for multiple correct answers."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="secondary-button text-xs py-1"
                >
                  <Plus size={13} /> Add Option
                </button>
              </div>

              <div className="space-y-2">
                {options.map((option, idx) => (
                  <div key={option.id} className="option-row">
                    <input
                      type={type === "MCQ_SINGLE" ? "radio" : "checkbox"}
                      name="correct-option"
                      checked={correctOptionIds.includes(option.id)}
                      onChange={() => toggleCorrectOption(option.id)}
                      className="w-4 h-4 text-blue-600 shrink-0"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOptionText(option.id, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 text-xs"
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(option.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isBoolean && (
            <div className="editor-subsection space-y-2">
              <label>Correct Invariant Value</label>
              <select
                value={expectedAnswer}
                onChange={(e) => setExpectedAnswer(e.target.value)}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          )}

          {(isText || isNumeric) && (
            <div className="editor-subsection space-y-2">
              <label>Accepted Reference Answer or Exact Regular Expression</label>
              <input
                type="text"
                value={expectedAnswer}
                onChange={(e) => setExpectedAnswer(e.target.value)}
                placeholder="e.g. O(log N) or 42.5"
                required
              />
            </div>
          )}

          {!isChoice && !isBoolean && !isText && !isNumeric && (
            <div className="editor-subsection space-y-2">
              <h4 className="text-xs font-bold text-slate-800">Specialized Evaluation Config</h4>
              <p className="text-xs text-slate-600">
                This question type uses the dedicated Lab/Code test harness execution sandbox during examination runtime.
              </p>
            </div>
          )}

          <div>
            <label>Grading Explanation / Solution Rationale</label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Detailed explanation displayed in student feedback or grading rubric..."
            />
          </div>
        </div>

        {/* SIDEBAR SETTINGS */}
        <div className="editor-sidebar space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
            Assessment Settings
          </h3>

          <div>
            <label>Teaching Unit</label>
            <select
              value={assignmentId}
              onChange={(e) => {
                const sel = assignments.find((a) => a.id === e.target.value);
                setAssignmentId(e.target.value);
                if (sel) setUnitCode(sel.unitId);
              }}
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.unitId}: {a.unitName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Question Format (63-Registry)</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCorrectOptionIds(["opt-1"]);
              }}
            >
              <option value="MCQ_SINGLE">Multiple Choice — Single Answer</option>
              <option value="MCQ_MULTIPLE">Multiple Choice — Multiple Answers</option>
              <option value="TRUE_FALSE">True or False</option>
              <option value="SHORT_ANSWER">Short Answer</option>
              <option value="LONG_ANSWER">Long Answer / Technical Essay</option>
              <option value="NUMERIC">Numeric Response</option>
              <option value="PROGRAMMING">C++ / Python Programming Task</option>
            </select>
          </div>

          <div>
            <label>Topic / Competency Unit</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Balanced Search Trees"
            />
          </div>

          <div>
            <label>Allocated Marks</label>
            <input
              type="number"
              min="0.5"
              max="50"
              step="0.5"
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label>Difficulty Tier</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="w-full primary-button justify-center py-2.5"
            >
              <Send size={14} /> {saving ? "Saving Draft..." : "Save to Question Bank"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
