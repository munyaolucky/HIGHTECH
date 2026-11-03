import React, { useState } from "react";
import { Plus, Search, Filter, BookOpen, CheckCircle2, Award, ArrowRight } from "lucide-react";
import { lecturerApi, QuestionBankItem } from "../services/lecturerApi";

interface QuestionBankProps {
  onCreateQuestion: () => void;
}

export default function QuestionBank({ onCreateQuestion }: QuestionBankProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedUnit, setSelectedUnit] = useState("ALL");

  const questions = lecturerApi.getQuestions({
    search,
    type: selectedType,
    difficulty: selectedDifficulty,
    unitCode: selectedUnit,
  });

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ASSESSMENT REPOSITORY &amp; 63-TYPE REGISTRY</span>
          <h1>Question Bank</h1>
          <p>Repository of reusable examination and CAT questions with automated grading keys.</p>
        </div>

        <button onClick={onCreateQuestion} className="primary-button">
          <Plus size={15} /> Create Question
        </button>
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompt or title..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Question Types</option>
            <option value="MCQ_SINGLE">Multiple Choice — Single Answer</option>
            <option value="MCQ_MULTIPLE">Multiple Choice — Multiple Answers</option>
            <option value="TRUE_FALSE">True or False</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="NUMERIC">Numeric Response</option>
            <option value="PROGRAMMING">Programming Code Task</option>
          </select>
        </div>

        <div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>

        <div>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Course Units</option>
            <option value="CSC 301">CSC 301: Advanced Data Structures</option>
            <option value="NET 303">NET 303: Cybersecurity Forensics</option>
          </select>
        </div>
      </div>

      {/* QUESTIONS LIST */}
      <div className="space-y-4">
        {questions.map((q) => (
          <article
            key={q.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 transition space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                  {q.unitCode}
                </span>
                <strong className="text-slate-900 text-sm">{q.title}</strong>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                  {q.type}
                </span>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {q.difficulty}
                </span>
                <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {q.marks} Marks
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-800 font-medium">{q.prompt}</p>

            {q.options && q.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt: { id: string; text: string }) => {
                  const isCorrect = (q.answerConfig?.correctOptionIds as string[])?.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      className={`p-2 rounded-lg border text-[11.5px] flex items-center justify-between ${
                        isCorrect
                          ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span>{opt.text}</span>
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {q.explanation && (
              <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] text-slate-600">
                <strong className="text-blue-950">Grading Explanation:</strong> {q.explanation}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Topic: {q.topic || "Core Curriculum"}</span>
              <span>Updated: {q.updatedAt} · Status: {q.status}</span>
            </div>
          </article>
        ))}

        {questions.length === 0 && (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
            No questions found matching your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
