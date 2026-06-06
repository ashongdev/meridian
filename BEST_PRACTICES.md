# CourseOS Backend Engineering Rules (STRICT MODE)

You are building the backend for **CourseOS**, a high-scale, course-native academic platform for university students in Africa.

You are NOT allowed to write naive, over-eager, or unoptimized backend logic.

You must follow these engineering rules at all times.

---

# 1. API REQUEST EFFICIENCY RULE (CRITICAL)

## ❌ NEVER DO THIS:

- API calls on every keystroke
- Unthrottled search requests
- Refetching full datasets on small UI changes
- Sending large payloads repeatedly
- Polling without reason

## ✅ INSTEAD DO THIS:

- Always implement **debouncing (300–500ms minimum)** for search inputs
- Use **request cancellation (AbortController or equivalent)** for stale requests
- Use **server-side pagination** for all list endpoints
- Use **cursor-based pagination**, NOT offset pagination for large datasets
- Cache frequent queries (Redis or in-memory where appropriate)

---

# 2. DATA FETCHING RULE

## ❌ NEVER:

- Fetch entire tables or full course datasets
- Over-fetch “just in case”
- Load unrelated course data when not needed

## ✅ ALWAYS:

- Fetch data strictly scoped to:
    - university_id
    - course_id
    - cohort_id

- Use **minimal response DTOs**
- Design APIs around “what the UI needs now”, not theoretical completeness
- Prefer multiple small targeted queries over one massive payload

---

# 3. SEARCH SYSTEM RULE

Search must NEVER be naive.

## ❌ NEVER:

- Direct DB LIKE queries on every keystroke
- Full-text scanning without indexing strategy
- Global search across all universities by default

## ✅ INSTEAD:

- Search must be:
    - scoped (university → course → content type)
    - indexed (full-text or search engine layer if needed)

- Implement:
    - debounced queries
    - ranked results (relevance scoring)
    - cached popular queries

---

# 4. CONTENT LOADING RULE

CourseOS handles large academic files (PDFs, past exams, notes).

## ❌ NEVER:

- Load full documents in API responses
- Return raw file blobs via API
- Reprocess files on every request

## ✅ INSTEAD:

- Store files in object storage (S3 or equivalent)
- Serve via CDN URLs
- Preprocess documents once:
    - extract text
    - chunk content
    - index embeddings

- Serve only metadata + preview snippets in APIs

---

# 5. AI REQUEST RULE (VERY IMPORTANT)

AI tutoring must be tightly controlled.

## ❌ NEVER:

- Send full course datasets to the LLM
- Run AI without retrieval constraints
- Allow open-ended global knowledge responses

## ✅ INSTEAD:

- Always use RAG (Retrieval-Augmented Generation)
- Scope every query to:
    - course_id
    - relevant document chunks only

- Cache repeated AI queries
- Enforce max token + context limits
- Log AI responses for debugging and improvement

---

# 6. DATABASE ACCESS RULE

## ❌ NEVER:

- Unindexed queries on large tables
- Cross-university joins without partitioning
- Fetching unrelated cohorts or courses

## ✅ INSTEAD:

- Always query using:
    - university_id (partition key)
    - course_id (secondary key)

- Design tables for:
    - high-write ingestion (uploads)
    - high-read retrieval (study sessions)

- Prefer DynamoDB-style access patterns OR properly indexed relational schema

---

# 7. STATE MANAGEMENT RULE

## ❌ NEVER:

- Store UI state in backend unnecessarily
- Recompute derived data on every request
- Sync transient UI interactions to DB

## ✅ INSTEAD:

- Only persist:
    - user actions that matter (uploads, posts, bookmarks, contributions)

- Keep UI state client-side unless persistence is required

---

# 8. RATE LIMITING & ABUSE CONTROL

## MUST IMPLEMENT:

- Rate limiting per user (especially AI endpoints)
- Upload throttling (to prevent spam)
- Search throttling (prevent cost abuse)
- Reputation-based trust scoring for content contributors

---

# 9. BACKEND SIMPLICITY RULE

## ❌ NEVER:

- Over-engineer microservices too early
- Create unnecessary abstraction layers
- Split services without scaling justification

## ✅ INSTEAD:

- Start with a modular monolith
- Only split services when:
    - scaling bottlenecks are proven
    - team size requires it

---

# 10. PERFORMANCE RULES

## MUST:

- Use caching for:
    - course pages
    - trending content
    - AI responses

- Use CDN for all static assets
- Avoid blocking synchronous processing
- Use background jobs for:
    - file processing
    - embedding generation
    - indexing

---

# 11. ERROR HANDLING RULE

## NEVER:

- Expose raw backend errors to clients

## ALWAYS:

- Return clean, structured error responses
- Log full errors server-side only
- Provide fallback states for UI resilience

---

# 12. DESIGN PRINCIPLE

Every backend decision must optimize for:

- Real student usage patterns (mobile-first, low bandwidth)
- Exam-time traffic spikes
- Messy, user-generated academic content
- Course-based data locality
- High read-to-write imbalance

---

# FINAL RULE

If a design choice increases complexity without improving:

- performance
- scalability
- correctness
- or user experience

👉 DO NOT DO IT.
