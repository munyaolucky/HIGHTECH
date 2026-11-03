# Source Validation Report

**Date:** 25 October 2026  
**Scope:** Consolidated HI-TECH College repository, including the AI Support Centre and approved knowledge-base workflow.

## Checks completed in this environment

- TypeScript/TSX syntax transpilation: **98 files parsed with no syntax diagnostics**. This is a syntax check, not a dependency-backed TypeScript typecheck.
- JSON/webmanifest parsing: **11 files parsed successfully**.
- CSS non-empty check: **19 of 19 files are non-empty**.
- Cross-platform and module integration source assertions: **48 checks passed** (`node scripts/check-cross-platform.mjs`).
- AI Support Centre rule assertions: **19 direct runtime assertions passed** against the isolated pure helper module. Coverage includes publication windows, role visibility, independent review, relevance ranking, safe no-match fallback and basic secret/contact redaction.
- Previously recorded Quality & Accreditation business-rule assertions: **12 groups passed** using the pure rule module in isolation.
- Lightweight Prisma text-structure scan: **101 models, 103 enums, approximately 1,697 field declarations and 330 `@relation` declarations**. No duplicate model/enum names, duplicate field names, unknown field types or unclosed model/enum blocks were detected. This scan is not a substitute for Prisma's validator and does not prove relation/constraint correctness.
- ZIP integrity: to be checked for the final archive after packaging.

## Checks not completed

- Dependency installation timed out at the package registry. Workspace packages are not installed in this environment.
- Full `npm run typecheck` and production builds were not completed. Syntax transpilation does not confirm cross-file TypeScript types or framework integration.
- Formal `prisma validate`, generated-client validation, migration generation and migration application were not run.
- The repository does not contain a committed Prisma migration history. A new database needs a reviewed baseline migration; an existing database needs its schema history recovered and preserved.
- Vitest suites, API integration tests, browser end-to-end tests and full cross-module workflows were not run.
- No live PostgreSQL server or configured external provider was available for database or provider integration tests.

## AI Support Centre source added

- Authenticated support assistant route mounted under `/api/ai` with request rate limiting.
- Knowledge article create, edit, submit, independent review, publish and archive endpoints.
- Knowledge visibility by role, publication window, expiry and explicit allowed-role list.
- Private conversation ownership and closed/escalated conversation guards.
- Role-filtered lexical article retrieval and citations re-filtered against current access policy.
- Optional OpenAI-compatible chat-completions adapter, with knowledge-only fallback when no provider is configured or the provider fails.
- Basic redaction before an external provider call. This is best-effort and is not a guarantee that all personal information is removed.
- Per-user monthly usage records and a configured usage limit.
- Explicit human-support handoff; transcript inclusion defaults off and requires user choice.
- Seed script for baseline institutional help articles.

## AI-specific limitations and required safeguards

- The provider adapter sends the current question after basic redaction and excerpts from approved knowledge articles. Obtain institutional privacy/provider approval before enabling external inference. Verify the provider's retention, training, region, and contractual data-handling terms.
- The assistant is not connected to private individual grades, invoice balances or document contents. It must not be presented as a live student-record lookup tool.
- Retrieval is lexical rather than semantic and can miss relevant guidance. Provider output and citations need an evaluation suite for grounding, prompt injection, sensitive-data handling and false claims.
- Add defined conversation retention/deletion, provider cost accounting, abuse monitoring, and audited administrative access before production use.

## Required before production

1. Install dependencies with a committed lockfile and obtain a clean full typecheck.
2. Run formal Prisma validation and generate/review an initial migration for a new database, or recover and preserve migration history for an existing database.
3. Run all Vitest suites and API integration tests against a dedicated PostgreSQL database.
4. Add authorization tests for every route, including cross-campus direct-ID attempts, owner-scope violations and self-review denial.
5. Run the web/mobile production builds, browser end-to-end tests and backup/restore drills.
6. Complete security, privacy, accessibility and deployment reviews.
7. Before enabling AI provider mode, approve the external data-handling arrangement and evaluate answer grounding, refusal behaviour, prompt-injection resistance and output privacy.
