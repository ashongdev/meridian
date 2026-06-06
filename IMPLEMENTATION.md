# Meridian — Implementation Plan

**Hackathon:** Hack the Zero Stack with Vercel v0 and AWS Databases  
**Track:** Track 3 — Million-scale Global App (Academic Social Platform)  
**Deadline:** June 30, 2026  
**Today:** June 6, 2026 — 24 days remaining

---

## What We're Building

**Meridian** is the social layer African university students never had. Per-course community hubs with verified past exams, a RAG-based AI tutor trained on uploaded course materials, and study groups — all in one place instead of six WhatsApp groups.

**Tagline:** "Study like your life depends on it."

---

## Architecture

### Database Stack (3-tier polyglot — judge-facing story)

| Layer | Service | Why |
|---|---|---|
| Primary relational | Aurora DSQL | Globally distributed active-active PostgreSQL; zero-downtime scale; fits Track 3 "million-scale" requirement |
| AI/Vector search | Aurora PostgreSQL + pgvector | Cosine similarity for RAG; stays in the AWS ecosystem; co-located with embeddings |
| Real-time / events | DynamoDB | High-throughput writes for presence, activity feeds, notifications; TTL-based session cleanup |

### Application Stack

| Layer | Service |
|---|---|
| Frontend + API | Next.js App Router on Vercel |
| File storage | Vercel Blob |
| Rate limiting | Upstash Redis |
| AI responses | Claude API via Vercel AI SDK |
| Document ingestion | Python AWS Lambda (async, fire-and-forget) |
| Auth | NextAuth v5 (Google OAuth) |
| ORM | Drizzle ORM |

---

## Milestone Plan

### M1 — Foundation `Jun 6–8` ← IN PROGRESS
**Goal:** Deployed app with auth, DB connection, and landing page live.

- [x] Next.js 16 project scaffold
- [x] Drizzle schema — users, universities, courses, memberships, posts, materials, groups, AI sessions
- [x] Aurora DSQL client setup (`src/lib/db/aurora-dsql.ts`)
- [x] Aurora PostgreSQL + pgvector schema (`src/lib/db/vector-schema.ts`)
- [x] NextAuth v5 Google OAuth (`src/lib/auth/config.ts`)
- [x] Auth middleware/proxy (`src/proxy.ts`)
- [x] Editorial landing page — 6-chapter story layout
- [x] Sidebar navigation (desktop + mobile bottom nav)
- [x] Design system — warm earthy palette, Syne + Fraunces + Inter, marquee, collage cards
- [ ] Deploy to Vercel (connect Aurora DSQL + DynamoDB env vars)
- [ ] Verify Google OAuth callback works on production domain
- [ ] `scripts/migrate.ts` — run Drizzle migrations against Aurora DSQL

---

### M2 — Core Community `Jun 9–12`
**Goal:** Students can register, find their university/course, enroll, post, and upload materials.

- [ ] `/register` page — university selection + course search
- [ ] `/explore` page — browse universities and courses (search + filter)
- [ ] `/dashboard` — enrolled courses, recent activity
- [ ] `/[university]/[course]` — course hub (Wall / Papers / Groups / AI tabs)
- [ ] `POST /api/posts` — create posts with type (question / discussion / resource)
- [ ] `POST /api/materials` — upload to Vercel Blob, SHA-256 dedup, fire Lambda webhook
- [ ] `GET /api/materials/[id]/download` — enrollment check + download redirect
- [ ] `POST /api/courses/[id]/join` and `/leave`
- [ ] Karma system — +10 per verified upload, displayed on profile
- [ ] Comments on posts (nested, 1 level deep)
- [ ] Post upvotes
- [ ] Seed script — `scripts/seed.ts` with 3 real universities, 10 courses, real past exam metadata

---

### M3 — AI Tutor `Jun 13–17`
**Goal:** Students can upload materials and ask questions grounded in their course content.

#### Python Lambda — Document Ingestion Pipeline
- [ ] `lambda/ingest/handler.py` — receives webhook from `/api/materials`
- [ ] PDF text extraction (PyMuPDF / pdfminer)
- [ ] Chunking strategy — 512 tokens, 64-token overlap, preserve section headers
- [ ] Embedding generation — OpenAI `text-embedding-3-small` (1536d)
- [ ] Store chunks + embeddings in Aurora PostgreSQL `material_embeddings` table
- [ ] Deploy Lambda with boto3, set env vars for RDS connection

#### RAG API Route
- [ ] `GET /api/ai/[courseId]/chat` — streaming response endpoint
- [ ] Embed the user's query
- [ ] Cosine similarity search against `material_embeddings` for that course (top-5 chunks)
- [ ] Build prompt: system context + retrieved chunks + conversation history
- [ ] Stream Claude response via Vercel AI SDK `streamText`
- [ ] Store session in `ai_sessions` (DynamoDB for fast write, Aurora for audit)

#### AI Tutor UI
- [ ] `/[university]/[course]/ai` — full chat interface
- [ ] Streaming message bubbles
- [ ] Source citations — link each AI answer back to the material chunk it came from
- [ ] Session history (last 10 exchanges shown)
- [ ] Usage gate — 10 queries/day free, unlimited on Pro

---

### M4 — Study Groups + Real-Time `Jun 18–22`
**Goal:** Students can form study groups, track presence, and use a shared Pomodoro timer.

#### Study Groups
- [ ] `/[university]/[course]/groups` — list + create study groups
- [ ] `POST /api/groups` — create group (name, max size, schedule, description)
- [ ] `POST /api/groups/[id]/join` and `/leave`
- [ ] Group detail page — member list, chat, shared session timer

#### Real-Time Presence (DynamoDB + SSE)
- [ ] DynamoDB `presence` table — `{ userId, courseId, status, ttl }` (TTL = 5 min, refreshed on ping)
- [ ] `GET /api/presence/[courseId]` — SSE stream, emits member counts every 10s
- [ ] Client heartbeat — ping every 60s to refresh TTL
- [ ] Online member count badge on course tab bar

#### Shared Pomodoro Timer
- [ ] DynamoDB `study_sessions` table — timer state per group
- [ ] `POST /api/groups/[id]/timer` — start/pause/reset (only group owner)
- [ ] SSE stream for timer state synced across group members
- [ ] 25/5 Pomodoro cycle with visual countdown

#### Notifications
- [ ] DynamoDB `notifications` table — `{ userId, type, data, read, createdAt }`
- [ ] Notification types: new post in enrolled course, new material uploaded, AI answer ready
- [ ] `GET /api/notifications` — unread count + latest 20
- [ ] Bell icon in sidebar with unread badge

---

### M5 — Monetization + Polish `Jun 23–26`
**Goal:** Freemium working, promo code for judges, UI polished.

#### Billing
- [ ] `/billing` page — Free vs Pro comparison
- [ ] Promo code redemption — `POST /api/promo/redeem` with code `MERIDIAN-JUDGE`
- [ ] `MERIDIAN-JUDGE` unlocks Pro for 30 days (hardcoded in table)
- [ ] 24-hour free trial auto-applied on signup (already in auth config)
- [ ] Usage tracking — AI query count per day stored in DynamoDB

#### Polish Pass
- [ ] Empty states for every page (no courses enrolled, no materials, no posts)
- [ ] Loading skeletons for course feed and materials list
- [ ] Error boundaries for API failures
- [ ] Mobile layout pass — test every page at 375px
- [ ] Performance audit — image optimization, bundle size, Core Web Vitals check
- [ ] `MERIDIAN-JUDGE` promo code banner visible on landing page

---

### M6 — Seed + Demo Prep `Jun 27–29`
**Goal:** Real content seeded, judges can evaluate immediately after signup.

- [ ] Seed 5 real universities (Ghana, UCT, Makerere, Lagos, KNUST)
- [ ] 20 real courses per university (use actual course codes)
- [ ] Upload 3+ real past exams per course (scan or find public ones)
- [ ] Run full Lambda ingestion on uploaded materials so AI Tutor is ready to demo
- [ ] Create demo account — credentials in README, enrolled in 3 courses with activity
- [ ] Write `ARCHITECTURE.md` — ADR for each database choice with rationale
- [ ] Record 3-minute demo video (loom or similar)
- [ ] Update README with judge access instructions, tech stack diagram
- [ ] Playwright E2E tests — signup → enroll → upload → AI query happy path
- [ ] Final production deploy + smoke test

**Submission: June 30, 2026**

---

## File Structure

```
meridian/
├── src/
│   ├── app/
│   │   ├── (main)/                     # Authenticated shell
│   │   │   ├── layout.tsx              # Sidebar + auth guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── explore/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   └── [university]/[course]/
│   │   │       ├── page.tsx            # Course hub (tabs)
│   │   │       ├── ai/page.tsx         # AI Tutor chat
│   │   │       └── groups/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── posts/route.ts
│   │   │   ├── materials/route.ts
│   │   │   ├── materials/[id]/download/route.ts
│   │   │   ├── courses/[id]/join/route.ts
│   │   │   ├── courses/[id]/leave/route.ts
│   │   │   ├── ai/[courseId]/chat/route.ts
│   │   │   ├── groups/route.ts
│   │   │   ├── groups/[id]/timer/route.ts
│   │   │   ├── presence/[courseId]/route.ts
│   │   │   ├── notifications/route.ts
│   │   │   └── promo/redeem/route.ts
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root — fonts, metadata
│   │   └── globals.css                 # Design system
│   ├── components/
│   │   ├── ui/
│   │   │   ├── sidebar-nav.tsx
│   │   │   ├── marquee.tsx
│   │   │   ├── floating-cta.tsx
│   │   │   └── academic-accents.tsx    # Hand-drawn SVG accents
│   │   └── course/
│   │       ├── post-feed.tsx
│   │       ├── materials-list.tsx
│   │       ├── enroll-button.tsx
│   │       └── ai-chat.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── aurora-dsql.ts          # Primary DB client
│   │   │   ├── aurora-pg.ts            # Vector DB client
│   │   │   ├── dynamodb.ts             # DynamoDB client
│   │   │   ├── schema.ts               # Drizzle schema (Aurora DSQL)
│   │   │   └── vector-schema.ts        # pgvector table
│   │   └── auth/
│   │       └── config.ts               # NextAuth v5 config
│   └── proxy.ts                        # Next.js 16 middleware
├── lambda/
│   └── ingest/
│       ├── handler.py                  # Document → chunks → embeddings
│       └── requirements.txt
├── scripts/
│   ├── migrate.ts                      # Run Drizzle migrations
│   └── seed.ts                         # Seed real university data
├── IMPLEMENTATION.md                   # This file
├── ARCHITECTURE.md                     # ADR for database choices (M6)
└── README.md                           # Judge access + setup instructions
```

---

## Environment Variables

```bash
# Aurora DSQL (primary)
AURORA_DSQL_ENDPOINT=
AURORA_DSQL_TOKEN=           # IAM token, rotated via AWS SDK

# Aurora PostgreSQL (vector)
AURORA_PG_URL=               # postgres://... with pgvector

# DynamoDB
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Auth
AUTH_SECRET=                 # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXTAUTH_URL=

# Storage
BLOB_READ_WRITE_TOKEN=       # Vercel Blob

# AI
ANTHROPIC_API_KEY=           # Claude API

# Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Lambda webhook
LAMBDA_INGEST_URL=           # API Gateway endpoint for ingest Lambda
LAMBDA_INGEST_SECRET=        # HMAC secret to verify webhook
```

---

## Judging Criteria Alignment

| Criterion (25% each) | How Meridian wins |
|---|---|
| **Technical Implementation** | 3-tier polyglot DB with clear rationale; Aurora DSQL active-active global distribution; pgvector RAG pipeline; DynamoDB for high-throughput events; Python Lambda async ingestion |
| **Design** | Editorial magazine-style layouts (not a template); asymmetric collage composition; warm earthy palette with single teal accent; Syne + Fraunces + Inter editorial type stack; WhatsApp-native mobile patterns |
| **Impact & Real-World Applicability** | Solves a real pain point (scattered academic resources) for a genuinely underserved market (African universities); monetization model is realistic ($3-5/mo Pro); seeded with real content from real courses |
| **Originality** | No equivalent product exists for African universities; the 3-DB architecture is motivated by actual use-case requirements, not over-engineering; "AI that passed the course" framing is distinctive |

---

## Judge Access

After signup at the deployed URL:

1. Use promo code **`MERIDIAN-JUDGE`** at `/billing` for 30-day Pro access
2. Or use demo credentials from `README.md` (account pre-seeded with courses, materials, and AI history)
3. First 24 hours after signup automatically get Pro trial — no code needed

---

## Key Technical Decisions

**Why Aurora DSQL over standard Aurora?**  
Active-active global distribution with no write conflicts — fits the Track 3 "million-scale" thesis. Students at University of Lagos and UCT Cape Town both hit the nearest region with <50ms latency.

**Why DynamoDB for presence/notifications instead of Postgres?**  
Presence requires sub-100ms writes with TTL-based auto-expiry. Notifications are write-heavy fan-out. Both would create hot spots in a relational DB at scale. DynamoDB's single-digit millisecond writes + native TTL make this the right fit.

**Why pgvector in a separate Aurora PostgreSQL, not in Aurora DSQL?**  
Aurora DSQL is PostgreSQL-compatible but doesn't support all extensions. pgvector requires the extension to be installed on the PostgreSQL instance, which Aurora DSQL does not support. The vector DB stays within AWS and shares the same VPC as DSQL.

**Why Python for the Lambda?**  
The ML/embedding ecosystem (PyMuPDF, tiktoken, boto3, numpy) is Python-native. Node.js alternatives exist but are heavier and less battle-tested for PDF processing. Python Lambda keeps the ingestion pipeline idiomatic.
