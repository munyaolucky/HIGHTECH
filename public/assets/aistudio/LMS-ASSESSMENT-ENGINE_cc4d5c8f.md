# LMS assessment engine

One reusable engine serves quizzes, CATs, examinations, assignments, practicals, surveys and competency checks. Code: `apps/api/src/services/question-engine.ts`, routes in `apps/api/src/routes/lms-assessments.ts`, screens `AssessmentStudio.tsx` (staff) and `ExamRunner.tsx` (students).

## Question types (18)
Auto-marked: multiple choice (single/multiple, partial or all-or-nothing), true/false, matching, ordering, fill-in-the-blank, numeric (absolute or percent tolerance), formula (safe expression evaluator, no `eval`), hotspot. Marked by a person: short answer (optional provisional keyword score), essay (rubric), file upload, code, practical checklist, oral, competency. Unscored: survey rating, survey text.
Adding a type means adding one entry to `QUESTION_TYPES` (validate, candidate view, mark). **Your spec described 63 types and 12 formats; that document was not visible to me, so I built the types named in the LMS feature catalogue.** Send the list and I will map the remainder onto this registry.

## Rules enforced on the server
- Answer keys never leave the server: candidates receive `candidateView()` output only (tested for every type).
- Questions go DRAFT → IN_REVIEW → APPROVED by a different person; approved questions are immutable and changed by versioning.
- Assessments are published by someone other than the author, and only if every fixed question is approved and every random pool has enough approved questions.
- Each attempt freezes the questions it used (version snapshot); presentation order is seeded per attempt.
- The deadline is the earlier of the time limit and the closing time (plus any extra time); autosave and submission use the server clock; answers saved after the deadline (30 s grace) are ignored.
- Marking is anonymous in the queue, rubric scores are validated, totals recalculate, and results reach students only after a release step by an authorised person. Pass/fail stays blank while anything is unmarked.
- Item analysis (difficulty, discrimination, reliability, option counts) is advisory and never changes a mark.

## Sample content
The three JSON files in `apps/web/src/sample/` were converted from *File Management and I/O Management — Notes and Assignment*: the 100-mark assignment (sections 20/30/30/20, rubrics derived from what each question asks for), a 24-mark auto-marked self-check quiz written from the notes' own tables, and the optional practical tasks. They load as **drafts**; lecturers must review rubrics and approve. The source document gives no marks for Part C, so 1 mark per step is a placeholder. Its sub-question numbering also repeats numbers 9–15 across Sections C and D; the import uses unambiguous labels (C10a, D12 …).

## Not built yet
Sandboxed code execution, file attachments to answers, plagiarism checks, proctoring, adaptive and branching formats, double marking and moderation workflow, accommodations (extra-time UI), question-bank import from files, live classes, and the remaining LMS catalogue areas. Everything here is typechecked and unit-tested but has not run against a live database.
