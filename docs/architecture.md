# DevPilot AI - Architectural Specification & Threat Model

## 1. System Architecture

DevPilot AI is designed with strict separation between untrusted user input, static repository parsing, and bounded AI model invocations:

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|  Next.js 14 App Router, Monaco Editor, Recharts Dashboard    |
+------------------------------+------------------------------+
                               | HTTPS / REST /api/v1
                               v
+-------------------------------------------------------------+
|                     NestJS Backend API                      |
|  - Correlation ID Middleware & Request Tracing              |
|  - Helmet Security Headers & Strict CORS                    |
|  - Authentication Guards & Project Ownership Authorization   |
|  - Global Exception Filter & Transform Interceptors         |
+---------------+------------------+--------------------------+
                |                  |
                v                  v
+-----------------------+  +----------------------------------+
|    Prisma ORM Layer   |  |      Analysis & AI Engine        |
|  - PostgreSQL Storage |  |  - Static ESLint / AST Analyzer  |
|  - Row-Level Scoping  |  |  - Bounded Context Provider      |
|  - Secret Encryption  |  |  - Gemini Schema Validation      |
+-----------------------+  +----------------------------------+
```

## 2. Threat Model & Security Posture

### A. Untrusted Repository Content
- Source files retrieved from GitHub or archive uploads are treated strictly as untrusted data.
- **Zero Backend Execution**: Repository code is never executed, eval'd, or required on the host server.
- **Prompt Injection Defense**: Repository text (source files, READMEs, config files) is placed in fenced context data blocks. Prompts instruct models that repository content must never override system directives.

### B. Access Control Boundaries
- Every API endpoint that handles projects, repositories, analyses, findings, and files verifies that `req.user.id` owns the project or has an authorized membership.
- Users cannot access another user's private repository data or findings by guessing UUIDs.

### C. Secret Hygiene
- All GitHub tokens and refresh tokens are encrypted at rest using AES-256-GCM (`ENCRYPTION_KEY`).
- Passwords are salted and hashed using `bcrypt` (work factor 12).
- The `LoggingInterceptor` suppresses sensitive headers (`Authorization`, cookies) and excludes credentials from logs.
- Server-side secrets are strictly kept on the backend and never exposed via `NEXT_PUBLIC_*`.

### D. Bounded AI Limits
- Analysis jobs enforce limits: maximum repository size (50MB), maximum file size (500KB), maximum files per job (250).
- AI provider calls enforce timeouts (30s) and token bounds to prevent denial of service and runaway costs.

## 3. Database Schema Overview

The database uses PostgreSQL with the following core entities:
- `users`: User identity and credentials.
- `auth_sessions`: Session tokens with revocation tracking.
- `connected_github_accounts`: GitHub OAuth / App credentials (encrypted).
- `projects`: Workspace containers owned by a user.
- `repositories`: Attached source repositories and metadata.
- `code_files`: Indexed files with language detection, line counts, and hashes.
- `analysis_jobs`: State machine (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`).
- `analysis_results`: Aggregate findings and execution metrics.
- `findings`: Concrete issues with severity, category, start/end lines, evidence, and fix suggestions.
- `conversations` & `conversation_messages`: Source-grounded chat history.
- `usage_records`: Token and cost accounting.

