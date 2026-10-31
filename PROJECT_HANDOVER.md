# DevPilot AI Project Handover

## A. Project overview

DevPilot AI is intended to be an AI-assisted developer platform for connecting GitHub repositories, browsing source code, running static and AI-assisted analysis, managing findings, explaining code, and chatting against repository context.

The current repository is a TypeScript npm-workspace monorepo:

- `apps/web`: Next.js 14 App Router frontend with Tailwind CSS and shared client types.
- `apps/api`: NestJS 10 REST API with Prisma, PostgreSQL, Helmet, cookies, Swagger, validation, and request diagnostics.
- `packages/shared`: shared TypeScript enums and request/response interfaces.
- `prisma`: PostgreSQL schema containing the planned identity, project, repository, analysis, finding, conversation, and usage entities.

The currently implemented application workflow is authentication -> protected dashboard -> project workspace creation/list/detail. The repository and analysis workflows are represented in the schema and UI navigation but are not wired to backend functionality.

## B. Completed features

The following features have source implementation and passed the available automated checks:

- User registration and login with DTO validation and bcrypt password hashing (`apps/api/src/auth`).
- JWT-based sessions persisted in `AuthSession`, with cookie and bearer-token extraction, revocation checks, expiry checks, and user scoping.
- Logout and authenticated profile retrieval.
- Project ownership guard and authenticated project CRUD endpoints.
- Project summaries, finding severity aggregation, recent analysis summaries, and dashboard metrics from Prisma queries.
- Protected frontend routes and authentication context.
- Frontend login, registration, dashboard, project list, project creation, project detail, settings, and integration placeholder screens.
- Global API response transformation, exception handling, correlation IDs, logging interceptor, Helmet, CORS, Swagger setup, and validation pipe.
- Prisma schema generation/build compatibility.

The current working tree contains uncommitted inherited changes from the previous agent. They were not reset or overwritten during this audit.

## C. Partially completed features

- Project detail UI renders repository/analysis sections and navigation, but repository attachment, analysis, files, findings, and chat routes do not have matching backend modules.
- GitHub integration has environment variable names, database models, and a frontend placeholder, but no OAuth/App flow, token encryption service, repository API client, or sync endpoint.
- Analysis and findings have database models and shared types, but no job creation, queue/worker, static analyzer, AI provider, finding management endpoints, or persistence workflow.
- Dashboard metrics are implemented against the current database models, but there is no populated repository/analysis workflow to produce meaningful production data.
- Swagger is configured, but endpoint DTO metadata and documented error contracts are incomplete.

## D. Pending features

Priority order based on the codebase:

1. Implement GitHub account connection and repository selection/synchronization.
2. Add repository browsing and persisted `CodeFile` indexing with project authorization.
3. Implement analysis job creation/state transitions and deterministic static analysis.
4. Implement structured, schema-validated AI analysis with timeouts, bounded context, prompt-injection defenses, and usage accounting.
5. Add findings list/detail/status/update APIs and UI.
6. Add repository-aware chat with grounded context and conversation persistence.
7. Add analysis history, analytics, and production deployment documentation.
8. Add frontend tests, API integration tests, migration files, and non-interactive lint configuration.

## E. Known bugs and risks

- `apps/api/src/auth/token.service.ts` falls back to a hardcoded development JWT secret when `JWT_SECRET` is absent. Production startup should fail fast instead of accepting a fallback secret.
- `apps/api/src/auth/auth.controller.ts` and `apps/api/src/auth/guards/jwt-auth.guard.ts` use `any` for request extensions (`sessionId` and `user`), weakening type safety.
- `apps/api/src/auth/auth.service.ts` uses a fixed seven-day session duration instead of the configured `JWT_EXPIRES_IN`.
- `apps/api/src/auth/auth.service.ts` performs the user existence check and creation as separate operations; concurrent registrations can rely only on the database unique constraint and should be mapped to a clean conflict response.
- `apps/api/src/projects/projects.service.ts` parses `languagesJson` without a validation guard; malformed persisted JSON would fail the entire project response.
- The project detail page still calls `alert('Repository analysis engine initialized in Phase 5.')`, which is a placeholder rather than a real analysis request.
- Frontend authentication refresh intentionally clears local state on any profile error, but does not distinguish an expected 401 from an unavailable API.
- Lint validation is not available: the API has no installed/configured ESLint command, while `next lint` prompts for configuration and exits non-interactively.
- No Prisma migration directory was found, so schema compatibility has only been checked with `prisma validate`; no database migration or live PostgreSQL test was run.
- No integration/e2e test suite was found or run.

## F. Technical architecture

### Frontend

Next.js App Router pages live under `apps/web/src/app`. `AuthProvider` in `apps/web/src/features/auth/auth-context.tsx` loads `/auth/me`, stores the current profile in memory, and uses `apiFetch` in `apps/web/src/lib/api-client.ts` with credentialed cookies. `ProtectedRoute` gates authenticated screens. Styling is Tailwind-based and follows the existing dark DevPilot design system.

### Backend

NestJS modules currently include `AuthModule`, `ProjectsModule`, `HealthModule`, and `PrismaModule`. Cross-cutting behavior is configured in `main.ts` and `common/`: validation, exception mapping, response envelopes, correlation IDs, logging, security headers, CORS, and Swagger.

### Database relationships

`User` owns `Project`, `AuthSession`, and connected GitHub accounts. `Project` owns repositories, analysis jobs, findings, conversations, and usage records. `Repository` owns indexed `CodeFile` records and analysis jobs/findings. `AnalysisJob` has one `AnalysisResult` and many findings. Conversations have messages, and usage records track project/user consumption. The schema is in `prisma/schema.prisma`; no checked-in migrations were found.

### API communication

The API uses the `/api/v1` global prefix and returns transformed response envelopes. The frontend calls it through `NEXT_PUBLIC_API_URL`, sends cookies with `credentials: 'include'`, and can also use bearer tokens supported by the backend.

### AI and external services

The schema and environment template anticipate Gemini-compatible AI requests and GitHub OAuth/App integration. No AI provider client, GitHub client, repository sync service, queue, or analysis worker is currently implemented.

## G. Environment requirements

Required variable names and purposes:

- `NODE_ENV`, `PORT`, `API_PREFIX`, `FRONTEND_URL`, `CORS_ORIGINS`: runtime and HTTP configuration.
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `SESSION_COOKIE_NAME`, `ENCRYPTION_KEY`: authentication/session and token-at-rest security configuration.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_APP_ID`, `GITHUB_CALLBACK_URL`: planned GitHub OAuth/App integration credentials and callback.
- `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_REQUEST_TIMEOUT_MS`, `AI_MAX_TOKENS_PER_REQUEST`: planned AI provider configuration and limits.
- `MAX_REPO_SIZE_MB`, `MAX_FILE_SIZE_KB`, `MAX_FILES_PER_ANALYSIS`, `MAX_CONCURRENT_ANALYSIS_JOBS`: planned analysis guardrails.
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME`: browser-visible frontend configuration.

Credential-bearing variables are required only for the corresponding database, GitHub, and AI integrations. Secret values are intentionally not recorded here.

## H. Validation status

Validation was run on 2026-10-31 in the inherited working tree:

- Frontend typecheck: **PASS as part of `npm run build`** (Next.js compiled and completed type validity checks).
- Backend typecheck/build: **PASS as part of `npm run build`** (`nest build`).
- Shared package build: **PASS** (`tsc`).
- Frontend production build: **PASS** (`next build`; 11 routes generated).
- Backend tests: **PASS** — 5 suites and 28 tests.
- Frontend tests: **NOT AVAILABLE** — no frontend test script or test files were found.
- Lint: **BLOCKED/NOT RUN TO COMPLETION** — API `eslint` executable is unavailable; frontend `next lint` requires interactive initial configuration.
- Prisma schema validation: **PASS** (`npx prisma validate`).
- Database migration/schema execution: **NOT RUN** — no checked-in migrations and no live database verification performed.
- Integration/e2e tests: **NOT AVAILABLE** — no runnable integration suite was found.
- AI/GitHub integration: **BLOCKED** — provider credentials and implementation are not present.

## Recommended next task

The highest-priority incomplete core workflow is **GitHub repository integration**: add a backend-owned OAuth/App connection flow, encrypted credential storage, authorized repository listing, and an endpoint to attach a selected repository to a project. This should be implemented incrementally without changing the existing project/auth architecture, followed by focused API tests and a frontend integration screen wired to real responses.
