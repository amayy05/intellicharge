# IntelliCharge — Full Senior Engineer Audit, Repair, and 10-User Testing Prompt

> **How to use:** Open the IntelliCharge repository in Codex, Cursor, Antigravity, or another coding agent that can read and edit the whole workspace. Paste the prompt below. Keep the repository under version control and review the diff before accepting changes.
>
> **Important:** Automated browser sessions can simulate 10 user journeys, but they are not a substitute for 10 real people. This prompt requires both: automated testing with 10 isolated test accounts and a practical plan to recruit and observe 10 real testers. Do not claim that real humans tested the project unless they actually did.

---

## MASTER PROMPT — COPY FROM HERE

Act as a **senior full-stack engineer, application-security reviewer, QA lead, product usability researcher, and deployment engineer**. Conduct a strict, evidence-based audit of the entire IntelliCharge repository, repair verified defects, run tests, and prepare a safe staging deployment and a 10-user test program.

Be direct. Do not praise the project unless the evidence warrants it. Do not invent files, line numbers, test results, user feedback, metrics, integrations, or features. Do not stop after producing a report: inspect the repository, make the changes that are safe to make, run the available checks, and report exactly what did and did not pass.

## 0. Operating rules

1. **Read the entire project before making architectural claims.** Enumerate tracked and untracked project files, including source, config, schemas, migrations, scripts, tests, documentation, lockfiles, CI/CD, Docker files, and deployment manifests. Exclude generated/vendor folders only after identifying them.
2. Create a file inventory and inspect each relevant file. For large generated or binary assets, record the path, type, size, and reason it was not read as text. Do not claim to have read a binary asset's contents.
3. Work on a new branch, e.g. `audit/fix-and-test`, or create a clean backup. Never overwrite user work silently. Check `git status` and preserve pre-existing changes.
4. Never expose secret values in the report or terminal output. If a secret appears committed, report its file/path and type, redact its value, rotate/revoke it, and remove it from active code. Do not assume deleting it from the latest commit removes it from Git history.
5. Use repository evidence. Every finding must include path, line range, reproduction/evidence, impact, severity, and a specific fix. Line numbers must match the current version after changes.
6. Do not claim a test passed unless it was actually executed and its exit status/result was inspected. Clearly label skipped tests and why they were skipped.
7. Do not silently introduce paid APIs, paid services, telemetry vendors, or dependencies. Prefer free/local options where practical; disclose cost, account requirements, and trade-offs before requiring an external service.
8. Do not deploy publicly, migrate production data, delete user data, rotate live secrets, or incur costs without explicit authorization. You may prepare deployment configuration and a staging checklist.
9. Never put real personal information in seed data. Use clearly synthetic records and a separate test environment/database.
10. Do not pretend that mocked data, a local model, an external API fallback, or a rule-based estimator is a verified real-world AI feature. Label simulated/demo data in the UI and documentation.
11. If the source tree is incomplete, continue with all other available work, identify blockers, and provide exact recovery steps. Do not fabricate missing source files.
12. Avoid broad refactors when a small targeted fix is safer. Do not rewrite functioning architecture just to impose a preferred stack.

## 1. Overview and architecture

Produce a concise architecture summary with:

- What IntelliCharge currently does, based on implemented behavior.
- Frontend, backend, database, ORM, authentication, model/AI integration, external APIs, deployment target, and testing stack.
- Main request/data flow from UI to backend to database/external services and back.
- Entry points, important routes, models, schemas, services, configuration and migrations.
- What is implemented, partially implemented, mocked, broken, or only described in documentation.
- A Mermaid architecture diagram if the actual repository supports a truthful diagram.

Do not infer a technology or feature from a dependency alone; find where it is actually used.

## 2. Full repository and code-quality audit

Inspect the whole project and report verified findings in these categories:

### Correctness and reliability
- Crashes, runtime errors, wrong calculations, race conditions, state bugs, incorrect units, time-zone problems, pagination errors, stale state, inconsistent DB transactions, duplicate operations, and invalid assumptions.
- Missing or weak error handling, timeouts, retries, cleanup, resource closing, and failure states.
- API contracts that do not match frontend expectations.
- Broken links, routes, form submissions, buttons, navigation, empty states, loading states, and responsive layouts.

### Security
- Hardcoded credentials, API keys, JWT/session secrets, private tokens, unsafe CORS, debug endpoints, sensitive logs, insecure cookies, missing rate limits, unsafe file handling, injection risks, SSRF, XSS, CSRF where relevant, insecure deserialization, and vulnerable dependencies.
- Authentication and authorization on every private endpoint.
- Object-level ownership checks for vehicles, queues, bookings, charging sessions, user preferences, and any user-specific record.
- IDOR/BOLA risks: attempt to access or modify another test user's records by changing IDs.
- Password handling, token expiry, refresh/revocation behavior, password reset, and account enumeration, where implemented.
- Input validation at trust boundaries, output encoding, safe error messages, least-privilege database credentials, and secrets management.
- Public demo/test accounts that share writable state.
- Ensure a JWT secret is never a known fallback in staging/production; fail startup clearly if required secrets are missing or weak.
- Verify CORS is an explicit allowlist in production, not `*` with credentials.
- Do not claim a security guarantee merely because a library is installed.

### Performance and maintainability
- N+1 queries, unbounded result sets, repeated API requests, heavy initial bundles, unnecessary dependencies, oversized images, expensive renders, blocking work, repeated parsing, inefficient DB indexes, and missing caching where appropriate.
- Duplicate components/utilities, dead code, unused imports/dependencies, circular imports, tangled responsibilities, unnecessary abstractions, and configuration duplication.
- Accessibility: labels, keyboard navigation, focus states, contrast, semantic controls, and reduced-motion support.
- Responsive behavior on phone, tablet and desktop.

For every finding use this format:

| ID | Severity | Category | File:line | Evidence/reproduction | User/business impact | Exact fix | Test that proves the fix |
|---|---|---|---|---|---|---|---|

Severity definitions:
- **Critical:** immediate exposure of sensitive data, remote compromise, or a serious production incident likely.
- **High:** authorization bypass, account/data compromise, core workflow blocked, or severe correctness failure.
- **Medium:** important workflow or reliability/performance issue with a practical workaround.
- **Low:** limited impact, maintainability, polish, or minor usability issue.
- **Info:** verified observation or recommendation that is not itself a defect.

Avoid vague findings such as “improve security.” State the vulnerable route/code path and exact change.

## 3. AI-slop / fake-feature audit

Search source, UI text, docs, assets and config for:

- Lorem ipsum, TODO/FIXME, placeholder copy, fake logos, fabricated testimonials/reviews, fake counters, unsupported percentages, fake ratings, fake “live” status, demo users, synthetic histories, and unverified model accuracy.
- Buttons/links that do nothing, forms that never submit, fake loading states, static responses presented as live AI, random predictions, fallback logic that masks failures, and UI controls disconnected from backend behavior.
- “AI-powered” claims without a real model or reproducible inference path.
- Over-commented generated boilerplate, duplicate components, dead routes, unused packages, repeated CSS, unnecessary animations, and decorative sections that distract from the core use case.
- Test data accidentally included in production builds.

For each item include file and line, exact evidence, whether it is harmless demo content or misleading, and the action: remove, replace, label as demo, or implement properly. Do not call code “AI-generated” based on style alone; report observable boilerplate or duplication rather than guessing authorship.

## 4. Frontend reduction and product focus

Review each page, section, component, animation, icon/font package, chart, carousel, modal, and third-party script.

Create a table with:
- Keep / Remove / Merge / Simplify / Needs evidence.
- Actual user value.
- Bundle/runtime/accessibility cost.
- Files affected.
- Any user journey that would break if removed.

Keep only what supports a real user task. Do not remove useful accessibility, error, empty, or loading states just to make the UI smaller. Preserve a clear, consistent visual identity while prioritizing working functionality over decoration.

## 5. Hardcoded data and source-of-truth audit

Find every hardcoded business value, mock array, fake API response, static prediction, fallback result, demo account, sample user, local storage fixture, placeholder image, and environment-dependent URL.

Use a table:

| Value/data | Location | Current role | Real source of truth | Required behavior if source fails | Priority |
|---|---|---|---|---|---|

For each important instance, show replacement code appropriate to this repository. Use:
- Database records for persistent users, stations, queues, bookings, vehicles and sessions.
- Authenticated user input for user-owned preferences/vehicle details.
- External APIs only where they are actually available and their terms/limits are acceptable.
- Environment variables for secrets and deploy-specific URLs.
- Explicitly labeled seeded fixtures for test/staging.
- Reproducible model inference and validated inputs for AI predictions.

Do not blindly replace every constant: constants such as units, limits and domain rules may correctly remain constants. Explain which hardcoded values are legitimate and which are fake operational data.

For AI/ML outputs:
- Identify whether results come from a trained model, external provider, local model, heuristic, or mock.
- Trace model artifact, feature schema, preprocessing, training/evaluation scripts, metrics source, versioning and inference path.
- Verify that model metrics can be reproduced from a held-out dataset and that data leakage is considered.
- Do not invent real-world accuracy. Show uncertainty or a transparent “estimate” label when appropriate.
- If no validated model/data exists, implement a clearly labeled baseline/estimate or disable the misleading claim rather than inventing performance.

## 6. Apply fixes — do not stop at the report

First create a prioritized plan:

- **P0:** secrets exposure, authentication/authorization bypasses, data loss, unsafe public access.
- **P1:** broken build/startup, blocked core flows, incorrect charging/queue/session logic, major data integrity bugs.
- **P2:** validation, error states, performance, accessibility, maintainability, data provenance.
- **P3:** low-value decoration, copy polish, minor refactors.

Then apply fixes in dependency order. For each fix:
1. Explain the defect briefly.
2. Edit the actual source file.
3. Add/update a regression test.
4. Run the relevant test.
5. Record the result and any limitation.

Requirements:
- Restore missing source only if there is enough evidence to reconstruct it correctly. If frontend source is missing, inspect Git history, branches, manifests and references. If unrecoverable, clearly state that the build is blocked and ask for the correct source rather than fabricating a full frontend.
- Add or improve automated tests for authorization, input validation, domain calculations, error handling and key user journeys.
- Use migrations for schema changes; do not rely on unsafe schema mutation at application import.
- Do not suppress migration/startup failures.
- Add timeouts and safe handling for external API/model calls.
- Ensure logs are useful but do not include credentials, tokens or unnecessary personal data.
- Update `.env.example`, setup instructions and deployment docs. `.env.example` must contain placeholders only.
- Do not mark P0/P1 fixed unless the regression test proves the relevant behavior.
- Avoid changing API behavior without updating frontend callers and tests.

## 7. Required testing

Discover the actual test framework and use the existing tools where possible. Add tests only where they improve coverage and fit the stack.

Run and report the real result of:
- Dependency installation or lockfile consistency check, where safe.
- Lint/format/type checks if configured.
- Backend unit and integration tests.
- Frontend unit tests and production build.
- API contract tests.
- Database migration checks against a disposable test database.
- Security tests for authentication, authorization, ownership isolation and invalid input.
- End-to-end browser tests for primary journeys.
- A smoke test against the staging deployment if deployment is authorized and available.

If a check cannot run, state exactly why. Never substitute “looks good” for execution.

## 8. Automated test with 10 isolated users

Implement an automated test suite that exercises **10 distinct test users**, each with an isolated account and data. Use the project's existing framework or, if suitable, Playwright for browser E2E and pytest/httpx (or the repository's existing stack) for API tests.

Important: ten accounts do not necessarily mean ten simultaneous users. Test both ten independent user journeys and a modest concurrent workload.

### Test users
- Create 10 synthetic accounts in a disposable test/staging environment only.
- Give each a unique user ID and unique email such as `tester01@example.test` through `tester10@example.test`.
- Never use real emails or production credentials.
- Give the accounts different, realistic synthetic vehicles/preferences so the test can detect data leakage.
- Seed stations and queues with deterministic, documented data.
- Make test data creation repeatable and cleanup safe. Never run destructive cleanup against production.

### Automated scenarios
For each of the 10 users, attempt the applicable real product journey:
1. Register or authenticate using the supported flow.
2. View stations and station details.
3. Submit valid vehicle/preferences and get recommendations.
4. Join a queue or create a booking if implemented.
5. View their own queue/session state.
6. Update or leave their own queue/cancel their own booking if supported.
7. Handle invalid input, unavailable station, or simulated external-service failure.
8. Sign out/expire the session if supported.

Do not test nonexistent features as though they exist. Map scenarios to actual routes and mark unavailable features as product gaps.

### Authorization-isolation tests
At minimum, assert that:
- User A cannot read User B's private vehicle/session/booking/queue data by substituting an ID.
- User A cannot update, cancel, complete or delete User B's record.
- Unauthenticated requests to protected endpoints receive the correct 401/403 response.
- A user's logout/expired token cannot continue protected actions.
- Public station browsing, if intentionally public, still works without authentication.
- A shared demo identity is not used to store data for unrelated users.

### Concurrency and integrity
Run a modest controlled test with 10 concurrent sessions or clients, using a documented tool (for example, Playwright workers, pytest async clients, or Locust if already justified). Check:
- Duplicate queue joins/booking submissions.
- Race conditions around queue position and session completion.
- Database integrity and cross-user leakage.
- Error rate, p50/p95 response latency, and timeout behavior.
- No uncontrolled load against external APIs or paid services.

Do not label this a load test for thousands of users. It is a 10-user functional/concurrency check.

### Results
Generate `reports/ten-user-test-results.md` containing:
- Date/time and commit hash.
- Environment and test command.
- User IDs (synthetic aliases only).
- Scenario matrix for users 01–10.
- Pass/fail/blocked per scenario.
- Failed assertions and concise sanitized logs.
- p50/p95 latency where measured, sample count, error rate, and method.
- Defects discovered and linked regression tests.
- Explicit note that automated accounts are simulated users, not human usability participants.

If possible, also generate machine-readable JUnit XML/JSON in the test output folder. Never fabricate success rows.

## 9. Real human usability test with 10 people

Prepare a protocol for recruiting and testing 10 real participants. Do not claim to have contacted, recruited, observed, or received feedback from real people unless that actually happened.

### Recruitment and setup
- Recruit 10 people who resemble intended users, ideally with varied familiarity with EV charging apps.
- Use a staging URL and separate test database, never production.
- Use consent language explaining what is recorded, how long it is kept, and that participation is voluntary.
- Ask participants not to enter personal, payment, vehicle-identification or other sensitive real data.
- Use synthetic vehicles and clearly labeled sample stations.
- Provide a moderator script and a short debrief.
- Offer a remote test option with screen sharing only with informed consent; do not secretly record audio/video.

### Give each participant these tasks
1. Open the app and explain what they think it does.
2. Find a charging station suitable for a provided synthetic vehicle.
3. Compare two stations and explain which they would choose.
4. Enter or select vehicle/preferences and request a recommendation.
5. Join a queue or make a booking if that feature is genuinely implemented.
6. Find their queue/session status and explain what it means.
7. Recover from a deliberately provided invalid input or unavailable-station state.
8. Find where they would get help or report a problem.

Tasks 5–6 must be marked “not applicable” if the corresponding feature is not implemented. Do not lead participants to the answer. Ask them to think aloud, but do not over-explain the UI.

### Collect
For each task:
- Completion: success / partial / failed.
- Time on task.
- Number of errors and backtracks.
- Where they hesitate or abandon.
- User confidence (1–5).
- One brief quote, only with consent and without identifying details.

After tasks, ask:
- What was easiest?
- What was confusing?
- Did any information look fake or untrustworthy?
- What would stop you from using this app?
- What one change would most improve it?
- Overall ease rating, 1–5.
- Would you use it again? Why/why not?

Create `reports/human-usability-test-kit.md` containing the moderator script, task sheet, consent/privacy note, feedback questionnaire, observation sheet and analysis template. Leave results blank until real sessions happen.

## 10. Feedback form

Provide a simple feedback form that can be used in Google Forms or an in-app staging page. Include:
- Participant code (not full name).
- Device/browser and screen size.
- Prior EV charging app experience (optional).
- Task completion for each task.
- Ease score per task (1–5).
- Overall ease score (1–5).
- Confusing/broken feature.
- Trust in station and prediction information (1–5).
- Would use again? yes/no/unsure.
- Optional open-ended feedback.
- Consent to quote anonymous feedback, separate from participation consent.

Do not collect passwords, payment data, precise location, VIN, phone number or other unnecessary sensitive data.

## 11. Observability and privacy

Instrument staging to capture, with appropriate minimization:
- Frontend uncaught errors and rejected promises.
- API status codes and sanitized error categories.
- Request latency and correlation/request IDs.
- Frontend initial load and primary API timings.
- Task start/completion/drop-off events.
- External API/model latency, timeouts and fallback use.
- Database errors and failed background work.
- Build/deployment version.

Never log passwords, auth tokens, secret keys, full request bodies by default, payment details, or unnecessary personal information. Restrict access to logs, set retention limits, and explain how logs are used to participants. Do not add a paid analytics vendor without approval. Prefer a lightweight, privacy-conscious approach already compatible with the project.

For the 10-user test report, include:
- Sample size and test environment.
- Error rate and latency method.
- Top failure points.
- Task completion rate per task.
- Median task time if enough observations exist.
- Qualitative themes, clearly separated from quantitative facts.
- No fake or extrapolated results.

## 12. Seed-data checklist

Add a repeatable staging/test seed script or fixture set, aligned to the real schema. Include:
- At least 8–12 synthetic charging stations, with realistic but clearly labeled sample data.
- A mix of connector types and power ratings that the actual application supports.
- A mix of availability states: available, busy, temporarily unavailable.
- Different prices only if the application actually models prices; label them as sample prices.
- Queue lengths including zero, short and longer queues.
- Synthetic vehicles with different battery capacities and connector compatibility.
- A few historical queue/session records only if the app uses history.
- A known case for an unavailable external API/model and a timeout/fallback case.
- A known invalid input and boundary-value fixture.
- Distinct records owned by each of the 10 test users.
- At least one deliberate cross-user authorization test fixture.

Document which data is synthetic. Use deterministic values or a fixed seed. Avoid random results that make tests flaky. Make seed operations idempotent and restricted to test/staging; fail safely if the environment is production.

Do not fabricate operational station availability or claim seed data is live. The UI must clearly label sample data.

## 13. Deployment and shareable staging link

Prepare a deployable staging configuration based on the actual stack. Do not assume files/frameworks exist.

Evaluate options appropriate to the repository, for example:
- Frontend: Vercel or another suitable static/frontend host.
- Backend: a compatible host for the actual Python/Node runtime.
- Database: managed PostgreSQL or the project's actual DB.
- Local alternative: Docker Compose for reproducible local testing.

Use current platform requirements only after verifying them. Document any free-tier limitations, sleep/cold-start behavior, database persistence limits, and account requirements. Do not promise that a service is free forever.

Required deployment artifacts where appropriate:
- Production build configuration.
- Dockerfile and health endpoint if compatible with the project.
- Environment-variable table with example values only.
- Database migration/release procedure.
- CORS allowlist and frontend API URL configuration.
- HTTPS and secret-management requirements.
- Staging-only seed command.
- Rollback procedure and safe cleanup.
- README instructions from clean clone to running locally and deploying.

Do not claim a public URL exists until it has actually been deployed and verified. If you cannot access deployment credentials, prepare the files and give exact manual steps for the repository owner to deploy and return the resulting URL.

## 14. Final deliverables

Create or update these files in the repository:

1. `reports/code-audit.md` — overview, architecture, all findings with exact file/line, severity, evidence, exact fix, AI-slop audit, frontend reduction and hardcoded-data inventory.
2. `reports/fix-plan.md` — prioritized P0–P3 tasks, dependencies, status and verification.
3. `reports/ten-user-test-results.md` — actual automated 10-account results; never fabricated.
4. `reports/human-usability-test-kit.md` — recruitment/consent, moderator script, 8 tasks, feedback form, observation sheet and results template for 10 real participants.
5. `reports/seed-data.md` — fixture inventory, provenance and reset instructions.
6. `reports/deployment.md` — staging architecture, environment variables, exact deploy steps, smoke tests, rollback and how to obtain a shareable URL.
7. `reports/test-results.md` — actual test commands, pass/fail/blocked outcomes and limitations.
8. Source code changes and regression tests.
9. `.env.example` with placeholders only, updated setup documentation and any required test/deployment configuration.
10. A final concise summary of changed files, unresolved risks, commands executed, real test results and the next actions required from the owner.

## 15. Acceptance criteria

The work is not complete until all applicable criteria are either verified or explicitly marked blocked:

- The whole repository has been inventoried and source/config/docs have been inspected.
- Findings cite real paths and current line numbers.
- No secret values are included in reports.
- Critical/high findings are fixed or clearly block release.
- Cross-user access tests prove isolation for all 10 synthetic users.
- Backend tests and frontend build are executed where the source is available.
- The primary user journey has automated regression coverage.
- Test data is isolated, deterministic and clearly labeled as synthetic.
- Results distinguish automated tests from real human sessions.
- A human test kit for 10 participants is ready, with blank results until sessions occur.
- Deployment instructions are reproducible and do not claim a link that does not exist.
- Any unresolved issue, failed test, missing source, or unavailable external credential is reported honestly.

## 16. Final response format

Return:
1. **Verdict:** release blocker / prototype-only / staging-ready / production-ready, supported by evidence.
2. **Top 10 findings:** severity, location and fix.
3. **Changes made:** exact files changed and why.
4. **Verification:** commands run and actual outcomes.
5. **10-user automated test:** count of passed/failed/blocked scenarios, concurrency method and limitations.
6. **10-person human test:** preparation status only unless actual people completed sessions.
7. **Deployment:** exact steps and real URL only if verified.
8. **Remaining risks:** no vague “future improvements”; list concrete blockers.
9. **Next actions:** ordered checklist.

Start by checking the current repository and Git status. Then inspect the files, make the audit, implement the highest-priority safe fixes, and run the tests. Do not stop at a proposed plan.

## END MASTER PROMPT

---

## Quick note about “testing with 10 users”

There are two different activities:

- **Automated 10-user test:** the coding agent can create 10 isolated synthetic accounts and run concurrent journeys against the app. This is repeatable and suitable for regression/security checks.
- **10-person usability study:** this requires 10 real people. The agent can prepare the tasks, consent language, feedback form and observation sheet, but must not invent participant responses or claim they participated.

For a first pass, run automated tests against a local or staging database. Do not point seeded test accounts, destructive tests or concurrency tests at production.
