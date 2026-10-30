# DevPilot AI

DevPilot AI is a production-grade AI software engineering assistant engineered to help developers understand codebases, uncover architectural bugs, review pull requests and diffs, search source code with verifiable grounding, and generate actionable patch suggestions.

---

## Architecture Overview

DevPilot AI is organized as a modular TypeScript monorepo:

```
devpilot-ai/
  apps/
    web/          # Next.js 14 App Router (Tailwind CSS, Monaco Editor, Recharts)
    api/          # NestJS 10 REST API (Prisma ORM, Security Headers, Health)
  packages/
    shared/       # Shared TypeScript types, DTO interfaces, API envelopes
  prisma/         # Database models, schema, and migrations
  docs/           # Architectural design, threat model, API specifications
```

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript (Strict), Tailwind CSS, Lucide Icons, Monaco Editor, Recharts.
- **Backend**: NestJS 10, TypeScript, REST API with versioned `/api/v1` routes, Helmet, Cookie-Parser, Swagger OpenAPI.
- **Database**: PostgreSQL with Prisma ORM.
- **AI Engine**: Structured output schemas, bounded repository context, Google Gemini / LLM abstraction.
- **Static Analysis**: ESLint, Tree-sitter parsing, and deterministic diagnostics.
- **Code Search**: PostgreSQL full-text search with indexed repository metadata.

---

## Getting Started

### Prerequisites

- Node.js >= 20.x (Recommended: v24.x)
- npm >= 10.x
- PostgreSQL >= 15.x

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in necessary configuration credentials:

```bash
cp .env.example .env
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Build Packages and Applications

```bash
npm run build
```

### 5. Run Development Servers

```bash
# Start backend API (Port 3001)
npm run dev:api

# Start frontend Web App (Port 3000)
npm run dev:web
```

---

## Health Check and Diagnostics

The backend provides a comprehensive diagnostic endpoint at `GET /api/v1/health`:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-10-30T14:40:00.000Z",
    "uptimeSeconds": 120,
    "version": "0.1.0",
    "services": {
      "database": { "status": "connected", "latencyMs": 3 },
      "aiProvider": { "provider": "gemini", "status": "configured" },
      "githubIntegration": { "status": "unconfigured" }
    },
    "memory": {
      "heapUsedMB": 42,
      "heapTotalMB": 68,
      "rssMB": 110
    }
  }
}
```

Swagger API documentation is hosted at `http://localhost:3001/api/docs`.

