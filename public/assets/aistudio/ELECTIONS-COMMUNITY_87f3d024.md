# Student Elections, Clubs & Community

This module extends the HI-TECH College platform with student elections, clubs and societies, community events, volunteer projects, and alumni profiles. The endpoints are mounted under `/api/elections` and `/api/community`.

## Student elections

### Election lifecycle

`DRAFT → NOMINATIONS_OPEN → NOMINATIONS_CLOSED → VOTING_OPEN → VOTING_CLOSED → RESULTS_PUBLISHED`

Each election has a campus, title, description, nomination window, voting window, positions and candidates. Date order is validated on creation. Only authorized election managers can create elections and advance lifecycle states. Nominations can be reviewed during the configured nomination window; outstanding pending nominations must be resolved before nomination close. Voter eligibility is snapshotted before voting opens and cannot be refreshed after voting begins.

### Secret-ballot data model

Eligibility and participation are kept separate from ballot contents. `ElectionParticipation` records whether a student has already voted, but it has no ballot foreign key and deliberately stores no timestamps. `ElectionBallot` has a cryptographically random ID and an election foreign key, but no voter foreign key. `ElectionVote` references only the ballot, position and candidate. The voting API does not create an audit event that associates voter identity with a selection. Unique constraints prevent more than one participation record per eligible student/election and prevent duplicate votes for one position on a ballot.

This design reduces direct identity linkage; it does **not** make a database-backed ballot system immune to timing correlation or privileged database tampering. Production elections need independent security review, restricted database/log access, retention policies, monitored count/reconciliation, and a documented dispute/observer process. Do not add request-body logging or tracing that records selections with the authenticated user ID.

### API routes

- `GET /api/elections` — list elections visible to the requester and approved candidates; management users may see pending nominations.
- `POST /api/elections` — create a draft election with positions.
- `POST /api/elections/:electionId/eligibility/refresh` — create eligible-student and participation rows without overwriting prior votes.
- `POST /api/elections/:electionId/nominations/open` and `/nominations/close` — manage nomination window.
- `POST /api/elections/:electionId/voting/open` and `/voting/close` — start/close voting.
- `POST /api/elections/:electionId/results/publish` — publish results following close.
- `POST /api/elections/:electionId/candidates` — student self-nomination.
- `PATCH /api/elections/:electionId/candidates/:candidateId` — review candidate status.
- `POST /api/elections/:electionId/vote` — one secret ballot submission per eligible student.
- `GET /api/elections/:electionId/results` — manager can view preliminary tally only after voting closes; other signed-in users can view it after publication.
- `POST /api/elections/:electionId/disputes` — student dispute submission.
- `GET /api/elections/:electionId/disputes` and `PATCH /api/elections/:electionId/disputes/:disputeId` — authorized dispute management.

The current first version configures one seat per position and each ballot chooses one candidate per position. Multi-seat/STV/ ranked-choice voting, independent ballot export, formal recounts, election observers, candidate eligibility criteria beyond the current student/campus checks, and automated election notifications are not included yet.

## Clubs and societies

- Staff with community-management permission can create clubs and manage their active/inactive status.
- Students can request membership in active clubs, view their membership status and leave where allowed.
- Authorized community reviewers can list membership requests and approve/reject/suspend them.
- Club code uniqueness is enforced per campus; membership uniqueness is enforced per club/student pair.

## Community events and attendance

Events support campus, optional club, category, description, location, start/end times, capacity, and lifecycle status. Users can register or cancel registrations; event managers can review the roster and record attendance/no-show/cancellation. Event publication and registration status are server-controlled. Capacity and time constraints must be checked by the server, not only the web form.

## Community projects and volunteering

Projects support campus, description, schedules, volunteering needs and a managed lifecycle. Students can register interest in volunteering. Authorized project managers can review volunteers and update their status. Project assignments, safeguarding checks, expenses and formal service-hour certification are not yet automated.

## Alumni

Students whose college record has a `GRADUATED` or `ALUMNI` registration status can create or update their alumni profile and choose whether to consent to public display. The consent-controlled alumni listing returns only published profiles with explicit public consent; in this starter all `/api/community` routes still require authentication, so it is not an anonymous public-website endpoint. Authorized staff can review profiles before publishing. Do not publish personal contact information without a separate, informed consent policy.

## Permissions

The API uses the existing authenticated-user and permission middleware. `elections:manage` is available to Super Admin, Admin, Principal, Registrar and Student Services Officer roles in the starter permission map. `community:manage` and `community:review` are role-configured separately. Students may nominate/vote/submit disputes for their own student record, join clubs, register for events, volunteer and manage their own alumni profile. Never rely on frontend tab visibility as an authorization control.

Branch-wide row-level authorization and institution-specific election regulations still need a dedicated review before operational use. A full end-to-end secret-ballot security assessment is required before real elections.

## Verification and limitations

Source syntax-transpilation and JSON/CSS parsing checks were run in the build environment. Unit assertions are available in `apps/api/src/services/election-rules.test.ts`. The package registry connection timed out during installation, so generated Prisma client typechecking, Prisma schema validation, migration generation/application, database-backed API tests and a full production build have not been verified here.

No generated migration is included. For a new empty database, generate the initial `foundation` migration from the complete current schema. For a database with an existing migration history, preserve that history and generate a follow-up migration named `elections_community`. Back up the database first and test the migration against a copy before applying it to any environment containing data.

After dependencies are installed, run:

```powershell
npm install
npm run db:generate
npm run db:migrate --workspace @hitech/api -- --name elections_community
npm run typecheck
npm test
npm run build
```

Do not run the follow-up migration command against a database that has tables but no matching Prisma migration history without first planning a safe baseline. Do not delete existing migrations or re-baseline a database that contains data.
