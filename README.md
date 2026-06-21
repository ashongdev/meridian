# Meridian

**The social layer African university students never had.**

Per-course community hubs with verified past exams and notes, a RAG-grounded AI tutor trained on your own course materials, live study groups with chat and a shared Pomodoro timer — instead of six different WhatsApp groups and a Google Drive nobody can find.

Built for **Hack the Zero Stack with Vercel v0 and AWS Databases** — Track 3 (Million-scale Global App).

---

## For judges — quick access

1. Open the deployed app and sign in with Google (the only auth method — no separate judge credentials needed).
2. Complete onboarding: pick a university (University of Ghana, University of Lagos, or Makerere University) and join one or more seeded courses.
3. Go to **Settings → Redeem a promo code** and enter:

   ```
   MERIDIAN-JUDGE
   ```

   This unlocks 30 days of Pro (unlimited AI tutor queries) on your account. `STUDENT50` is the public-facing equivalent (14 days), seeded separately so judge testing never contends with the limited judge pool.
4. Explore a course hub's four tabs: **Wall** (posts/upvotes), **Papers** (materials + AI ingestion), **Groups** (live chat + Pomodoro), **AI Tutor** (RAG chat grounded in that course's uploaded materials).

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design and the reasoning behind each database choice.

---

## Features

**Community**
- Per-course Wall — posts, comments, upvotes, karma awarded to authors on upvote
- Past exams / notes upload with SHA-256 dedup, type tagging, anonymous upload option
- Cross-course "My Study Groups" directory at `/study`

**AI Tutor**
- Per-course RAG chat grounded only in that course's uploaded materials (no hallucinated citations to documents that don't exist)
- Persisted chat history per user per course — reload the page, your conversation is still there
- `@AI` mentions inside group chat — ask the tutor a question inline, visible to the whole group, same RAG pipeline as the 1-on-1 chat

**Study groups**
- Create/join groups per course (8-member cap)
- Live presence, group chat, and a synced Pomodoro timer over Server-Sent Events
- WhatsApp/Telegram-style two-pane chat layout

**Monetization (hackathon scope)**
- Free tier: 10 AI queries/day. Pro: unlimited.
- Promo code redemption extends a Pro trial; "Upgrade to Pro" is a simulated checkout (no real payment processor — documented as a deliberate scope cut, see ARCHITECTURE.md)
- Karma score from upvoted posts, shown on the settings page

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend + API | Next.js 16 (App Router) on Vercel |
| Primary relational DB | Aurora DSQL |
| Vector store (RAG) | Postgres + pgvector (Supabase) |
| Real-time / presence | DynamoDB |
| File storage | Vercel Blob |
| Auth | NextAuth v5, Google OAuth only |
| ORM | Drizzle |
| AI | Vercel AI SDK, Gemini for generation, a local embedding model for retrieval |
| E2E tests | Playwright |

Full rationale for the three-database split is in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Local development

### Environment variables

Copy `.env.local` (not committed) with:

```
NEXTAUTH_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXTAUTH_SECRET, AUTH_SECRET
AURORA_DSQL_ENDPOINT, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
VECTOR_DB_URL                          # Supabase Postgres connection string, pgvector enabled
DYNAMODB_TABLE_PRESENCE, DYNAMODB_TABLE_NOTIFICATIONS
BLOB_READ_WRITE_TOKEN                  # Vercel Blob
GOOGLE_GENERATIVE_AI_API_KEY           # AI tutor generation
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN   # provisioned, not yet wired — see ARCHITECTURE.md
```

Aurora DSQL auth is IAM-token based, not a static password. The running app generates and refreshes its own token (`src/lib/db/aurora-dsql.ts`), but the one-off setup scripts below need one in the environment as `AURORA_DSQL_TOKEN`:

```bash
export AURORA_DSQL_TOKEN=$(aws dsql generate-db-connect-admin-auth-token --hostname <endpoint> --region <region> --expires-in 3600)
```

### Setup

```bash
npm install
npm run db:generate   # drizzle-kit generate — only needed after a schema change
npm run db:apply       # apply the migration to Aurora DSQL (non-interactive)
npm run db:indexes     # create indexes (async, Aurora DSQL style)
npm run db:vectors     # enable pgvector + create material_chunks on the Supabase store
npm run db:seed         # 3 real universities, 11 courses, judge promo codes
npm run dev
```

### Testing

```bash
npm run test:e2e      # Playwright, runs against a dev server on :3000
npm run test:e2e:ui    # same, with the Playwright UI runner
```

The E2E suite authenticates via a test-only login endpoint (`POST /api/test/login`) that mints a real NextAuth session directly, bypassing Google's OAuth screen (which can't be reliably automated). It's hard-disabled (returns 404) unless `NODE_ENV !== "production"` **and** an `E2E_TEST_SECRET` env var is set and matches the request. **Never set `E2E_TEST_SECRET` in a deployed Vercel environment** — its presence is the only thing standing between this endpoint and an auth bypass in production.

---

## Known scope decisions

These were deliberate cuts for hackathon time, not oversights — see ARCHITECTURE.md for the full reasoning:

- "Upgrade to Pro" is simulated (no Stripe/payment processor integration)
- Rate limiting is in-memory per server instance, not distributed (Upstash Redis is provisioned but not yet wired up)
- Aurora DSQL has no foreign keys or composite unique constraints — referential integrity and idempotency are enforced at the application layer instead
- Real course material seeding (actual past exams/notes per seeded course) is deferred — the app works correctly with zero materials, judges can upload their own to test the AI tutor end-to-end
