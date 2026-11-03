# AI Support Centre

## Scope

The authenticated AI Support Centre searches approved, published knowledge articles that are visible to the current user's role. It stores the user's own conversations, returns citations to currently readable articles, applies a configurable per-calendar-month message limit, and supports an explicit handoff to the existing Help Centre ticket workflow.

When no external AI key is configured, the assistant works in knowledge-only mode and returns relevant approved source excerpts. When configured, it calls an OpenAI-compatible `/chat/completions` endpoint with only the current question (after basic email/number/credential-pattern redaction) and the approved article context. It does not query private student grades, invoices, documents or other user records.

## Environment

Configure the following in `apps/api/.env` only if an external provider is approved:

```env
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=
AI_MODEL=gpt-4o-mini
AI_MONTHLY_MESSAGE_LIMIT=300
AI_REQUEST_TIMEOUT_MS=15000
```

Leave `AI_API_KEY` empty to disable external model calls. Never commit the key. The external provider's retention, data-processing and location terms should be reviewed before using it with real college data.

## Database setup

The schema introduces `KnowledgeArticle`, `AssistantConversation`, `AssistantMessage` and `AssistantUsage`. For a new empty database, generate the initial migration from the full schema. For an existing database, back up the database and preserve its current migration history, then generate a follow-up migration with `--name ai_support_centre`. Review the SQL before applying it.

After creating an active Super Administrator and applying the migration, seed baseline help content:

```powershell
npm run db:seed-ai-knowledge --workspace @hitech/api
```

The seeder upserts by slug and does not overwrite existing articles, so it can be rerun safely.

## API

All routes require an active signed-in account and use the current server-checked role.

- `GET /api/ai/status` — provider mode and monthly quota.
- `GET /api/ai/knowledge?q=...` — articles readable by the user; contributors see their own drafts, reviewers see the review queue.
- `POST /api/ai/knowledge` — create a draft; requires `ai:contribute`.
- `PATCH /api/ai/knowledge/:id` — edit an allowed draft or administrator-managed revision.
- `POST /api/ai/knowledge/:id/submit` — submit for independent review.
- `POST /api/ai/knowledge/:id/review` — approve/reject pending article; author cannot review own submission.
- `POST /api/ai/knowledge/:id/archive` — archive article; system administrator only.
- `GET /api/ai/conversations` and `GET /api/ai/conversations/:id` — own conversations only.
- `POST /api/ai/chat` — create or continue an open conversation.
- `POST /api/ai/conversations/:id/handoff` — explicitly create a support ticket, optionally including the transcript.
- `POST /api/ai/conversations/:id/close` — close the user's own un-escalated conversation.

## Security and limitations

- Retrieval checks publication status, effective dates, visibility and `allowedRoles` before an article is used.
- Conversation reads require ownership. Support staff do not get implicit access to every AI transcript. A transcript is copied to a support ticket only when the user explicitly selects that option.
- Knowledge article publication requires a reviewer distinct from the author.
- Monthly quota check uses a serializable transaction and the application also rate-limits the AI route.
- Provider failure falls back to the knowledge-only response; the system does not make up private account information.
- The current retrieval is lexical, not a vector-search or semantic RAG index. A future embedding/search implementation must preserve exactly the same permission filtering.
- Email, national identifiers and phone-like numbers are redacted from the model request, but this is only a basic precaution, not a guarantee that every sensitive string is detected. Do not enter confidential personal or financial details.
- Conversation retention/deletion policy, formal model evaluation, provider-specific privacy approval, token-level billing reconciliation and production abuse monitoring still require review.
- The database migration, generated Prisma client, dependency typecheck and end-to-end runtime tests must pass locally before production use.
