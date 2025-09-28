# İNSAN VE MEKAN — Journal App

A lightweight, editor-friendly web application for the academic journal **İNSAN VE MEKAN**.  
It streamlines **submission**, **peer review**, **issue building**, and **publishing** with a clean UI, bilingual content (TR/EN), and role-based workflows (Author, Reviewer, Editor, Admin).

> 📝 Tip: This README is structured as a living document. Keep it close to the code and update sections marked with **TODO** as you evolve the app.

---

## Table of Contents

- [Features](#features)  
- [Architecture](#architecture)  
- [Tech Stack](#tech-stack)  
- [Getting Started](#getting-started)  
  - [1) Prerequisites](#1-prerequisites)  
  - [2) Local Development](#2-local-development)  
  - [3) Docker (Optional)](#3-docker-optional)  
- [Configuration](#configuration)  
- [Database & Migrations](#database--migrations)  
- [Scripts](#scripts)  
- [Project Structure](#project-structure)  
- [Content Model](#content-model)  
- [Quality & CI](#quality--ci)  
- [Contributing](#contributing)  
- [Brand & Logo](#brand--logo)  
- [Roadmap](#roadmap)  
- [License](#license)

---

## Features

- ✍️ **Submissions:** authors upload manuscripts (PDF/Docx), ORCID/affiliations, cover letters.
- 🔎 **Double-blind Review:** editor assigns reviewers; deadlines, reminders, decision letters.
- 🧮 **Decision Workflow:** Accept / Minor / Major / Reject with tracked revisions.
- 🗂️ **Issue Builder:** curate accepted papers into volumes/issues; drag-and-drop ordering.
- 🌐 **Bilingual (TR/EN):** article metadata, UI labels, and URLs; SEO-friendly slugs.
- 🏷️ **Taxonomy:** keywords, topics, special issues; search & filters.
- 🧾 **Metadata & SEO:** DOI support (optional), Crossref-ready citation metadata, OpenGraph, RSS/Atom.
- 👥 **Roles:** Admin, Editor, Section Editor, Reviewer, Author, Reader.
- 🔐 **Auth:** email/password or SSO (e.g., ORCID, Google) — configurable.
- 🖼️ **Assets:** figures, images, supplementary materials (S3/MinIO compatible).
- 🧰 **Ops-ready:** .env-driven config, migrations, seeds, Docker compose (optional).

---

## Architecture

> **Note:** Keep only the relevant block below, depending on your stack.

### Option A — Node/Next.js (recommended)
- **Web**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui  
- **API**: Next.js Route Handlers (REST)  
- **DB**: PostgreSQL via Prisma  
- **Auth**: NextAuth (email + OAuth providers)  
- **Storage**: S3/MinIO for uploads  
- **Search**: Postgres `tsvector` or MeiliSearch (optional)

### Option B — Python/FastAPI
- **Web**: Next.js (frontend) or Jinja templates (if monolith)  
- **API**: FastAPI + Pydantic  
- **DB**: PostgreSQL via SQLAlchemy + Alembic  
- **Auth**: JWT / OAuth via Authlib  
- **Storage**: S3/MinIO  
- **Search**: PostgreSQL full-text or MeiliSearch

---

## Tech Stack

- **Language:** TypeScript / Python (choose your path)
- **Database:** PostgreSQL 14+  
- **Cache (optional):** Redis (queues, sessions, rate limits)  
- **Queue (optional):** Celery (Py) or BullMQ (Node) for emails/background jobs  
- **Container:** Docker & Compose for local parity  
- **CI:** GitHub Actions (lint, type-check, test, build)

---

## Getting Started

### 1) Prerequisites
- **Node** v18+ and **pnpm**/**npm** OR **Python** 3.11+ and **pip**/**uv**
- **PostgreSQL** 14+  
- **Docker** (optional, for one-command spin-up)

### 2) Local Development

#### If using Next.js + Prisma
```bash
# 1) Install deps
pnpm install

# 2) Environment
cp .env.example .env
# Edit .env (DB, NEXTAUTH, S3/MinIO, SMTP). See [Configuration] below.

# 3) DB: create & migrate
pnpm prisma migrate dev

# 4) Seed (creates admin and sample data)
pnpm seed

# 5) Run dev server
pnpm dev
```

#### If using FastAPI + SQLAlchemy
```bash
# 1) Create venv & install
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2) Environment
cp .env.example .env
# Edit DB URL, S3/MinIO, SMTP, SECRET_KEY

# 3) DB: create & upgrade
alembic upgrade head

# 4) Seed
python scripts/seed.py

# 5) Run
uvicorn app.main:app --reload
```

### 3) Docker (Optional)
```bash
# Starts web, api, postgres, minio, mailhog (if configured)
docker compose up -d --build

# View logs
docker compose logs -f app
```

---

## Configuration

Create `.env` from `.env.example` and fill:

```
# Shared
APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/insanvemekan

# Auth (choose your provider)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=TODO_generate_strong_secret
EMAIL_SERVER=smtp://user:pass@mailhog:1025
EMAIL_FROM="İnsan ve Mekan" <noreply@humanandspace.com>

# Storage (S3/MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=TODO
S3_SECRET_KEY=TODO
S3_BUCKET=ivm-uploads
S3_REGION=us-east-1

# Optional Search
MEILI_HOST=http://localhost:7700
MEILI_KEY=masterKey
```

> 🔐 **Secrets:** Never commit real secrets. Use `.env.local` for dev and a secret manager in prod.

---

## Database & Migrations

- **Prisma (Node):**
  ```bash
  pnpm prisma migrate dev        # create/update schema
  pnpm prisma studio             # inspect data
  ```

- **Alembic (Python):**
  ```bash
  alembic revision --autogenerate -m "change"
  alembic upgrade head
  ```

**Seeding:** creates an **admin** user, sample journal sections, and a dummy submission.
- Node: `pnpm seed`  
- Python: `python scripts/seed.py`

Default admin (change immediately):
```
email: admin@humanandspace.com
pass : change-me-now
```

---

## Scripts

> Keep or update based on your package manager.

**Node (pnpm)**
```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "seed": "tsx scripts/seed.ts",
    "migrate": "prisma migrate deploy"
  }
}
```

**Python**
```bash
make dev         # runs uvicorn
make test        # runs pytest
make fmt         # ruff+black
make migrate     # alembic upgrade head
```

---

## Project Structure

```
insan-ve-mekan-journal-app/
├─ app/                      # Next.js app router pages & API routes (or FastAPI app/)
│  ├─ (public-site)/         # Public journal pages (issues, articles)
│  ├─ (dashboard)/           # Editor/Admin dashboard
│  └─ api/                   # REST endpoints (Next.js route handlers)
├─ src/
│  ├─ components/            # UI components (forms, tables, editors)
│  ├─ lib/                   # utils (auth, i18n, storage, email)
│  ├─ server/                # services, repositories
│  └─ styles/                # Tailwind / global styles
├─ prisma/                   # Prisma schema & migrations (if Node)
├─ alembic/                  # Alembic migrations (if Python)
├─ public/                   # static assets (logo, icons, og images)
├─ scripts/                  # seeders, maintenance utilities
├─ docker/                   # Dockerfiles, compose fragments
└─ README.md
```

---

## Content Model

- **Article**: title, abstract (TR/EN), authors[], affiliations[], keywords[], manuscript_file, status  
- **Review**: reviewer, recommendation, comments_to_author, comments_to_editor, files[]  
- **Issue**: volume, number, year, cover, editorial, articles[]  
- **User**: role, name, email, ORCID, password/SSO  
- **Section**: e.g., Research Articles, Reviews, Notes  
- **Assets**: figures, supplementary materials (linked to Article)

---

## Quality & CI

- **Lint/Format:** ESLint + Prettier (Node) or Ruff + Black (Python)
- **Types:** TypeScript strict mode
- **Tests:** Vitest/Jest or PyTest
- **CI (GitHub Actions):**
  - `lint → typecheck → test → build`
  - optional: DB migration check, container build & push

---

## Contributing

1. Fork & create a feature branch  
2. Keep PRs small and focused  
3. Write tests for new behavior  
4. Update docs/README if needed  

**Commit style:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…)

---

## Brand & Logo

The journal’s visual identity includes:
- **Navy arch (kemer)** motif  
- **Teal open book**  
- **Three full-height silhouettes** (man, head-scarved woman, child)  
- **Serif logotype** “İNSAN VE MEKAN”

Assets live in [`/public/brand`](./public/brand).  
Use the SVG for crisp scaling; keep clear-space and don’t recolor core marks.

> If you need production-ready PNG/SVG exports or variants (dark/light), add them here and reference in the app’s `<head>` meta and OpenGraph tags.

---

## Roadmap

- [ ] ORCID login + profile import  
- [ ] Crossref XML export for DOIs  
- [ ] Reviewer availability & conflict-of-interest checks  
- [ ] i18n content parity checks (TR/EN)  
- [ ] Rich text editor with citation helper (CSL)  
- [ ] MeiliSearch integration for fast article search  
- [ ] Automated issue PDF (print layout)  
- [ ] Accessibility audit (WCAG 2.2 AA)  
- [ ] Metrics dashboard (submissions, acceptance rate, review times)

---

## License

MIT License

Copyright (c) 2025 Süha Kağan Köse

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---

### Maintainers

- **İNSAN VE MEKAN** editorial team — contact: **admin@humanandspace.com** *(update as needed)*

---

> Have ideas or find a bug? Open an issue or start a discussion. Contributions are welcome!
