# CourseOS Design Skill Spec (SKILL.md)

## Purpose

This skill defines how to design UI/UX, product flows, and system experiences for **CourseOS**, an academic social platform for university students in Africa. It ensures all outputs are consistent, non-generic, and grounded in real student behavior and course-based structures.

---

## Product Context

CourseOS is a course-native academic network where students:

- Share verified study materials (past exams, notes, solutions)
- Organize by university and course
- Join study groups and cohorts
- Use AI tutoring grounded strictly in uploaded course content

It combines:

- Community (Discord-like)
- Knowledge system (Notion-like)
- AI tutoring grounded in real academic material
- Contribution economy (upload → reputation → value)

### Target Users

- Primary: University students (18–26) in Africa
- Secondary: Graduated seniors contributing materials
- Future: Universities and student unions (institutional adoption)

### Core Value

“Upload your past exams once. Help every student who comes after you. Get AI that actually knows your course.”

---

## Core System Structure

All designs must map to:

University → Faculty → Course → Cohort → Content + Community

Everything is course-first. No generic social or SaaS abstraction.

---

## Hard Constraints

- Mobile-first always
- WhatsApp-native behavior assumptions
- Low bandwidth and inconsistent connectivity
- Messy academic content (PDFs, images, notes, scanned papers)
- Trust and verification are critical
- Reputation systems must matter
- AI must be grounded in course-specific data when available
- No generic SaaS design patterns

---

## UI/UX Design Principles

### 1. Anti-Template Rule

Never use standard SaaS layouts:

- No hero section + feature cards
- No generic dashboards
- No corporate UI patterns

### 2. Editorial / System-Like Design

All interfaces must feel:

- Asymmetric and magazine-like
- Layered and overlapping
- Visually dense but structured
- Designed as a narrative experience

### 3. Story-Based Flow

Pages should feel like:

- A journey through student life
- A progression through academic discovery
- A connected system, not isolated sections

---

## Visual Language Rules

### Layout

- Asymmetric composition
- Overlapping UI layers
- Organic and playful shapes
- Broken grid systems
- Collage-based sections

### Typography

- Bold hierarchy
- Editorial style headlines
- Mixed scale text for storytelling

### Imagery

- Real student/campus photography
- Blended with hand-drawn or sketch-style academic elements:
    - notes
    - diagrams
    - scribbles
    - maps
    - books
    - study icons

### Motion & Depth

- Subtle layering and depth
- Scroll-based transitions
- Floating or shifting UI elements
- Dynamic content blocks (not static grids)

---

## Interaction Design Rules

- Navigation must be minimal and secondary
- Experience should feel like browsing a living academic ecosystem
- Course discovery, content, and community must feel interconnected
- AI tutoring entry points must be embedded, not isolated
- UI should feel student-native, not product-native

---

## Content Presentation Patterns

Avoid static layouts. Prefer:

- Collage-style galleries for notes and past papers
- Staggered image + text blocks
- Vertical or horizontal marquees for highlights
- Layered cards with depth and overlap
- Mixed media blocks (image + annotation + metadata)
- Fragmented grids that feel organic, not uniform

---

## Call-to-Action System

- Primary actions must be floating and persistent
- CTA behaves like a “study companion” rather than a button
- Must follow scroll subtly without being intrusive
- Always visually dominant but context-aware

---

## AI Design Requirements

AI tutoring must:

- Only use course-specific uploaded content when available
- Clearly differentiate between grounded vs general knowledge
- Feel embedded in the learning flow, not separate
- Act like a study assistant inside the course ecosystem

---

## Trust & Reputation System

Design must assume:

- Users rely heavily on senior-uploaded content
- Verification of academic materials is essential
- Reputation drives contribution quality
- System must discourage spam and low-quality uploads

---

## Engineering Awareness (Implicit)

Even in UI/UX design tasks, assume:

- Course-based data architecture
- Strong relationships between university/course/content entities
- Retrieval-based AI architecture
- Scalable per-university clustering

---

## Output Behavior Rules

When generating any design or product experience:

1. Reject generic SaaS patterns automatically
2. Prioritize course-native structure
3. Design for African student behavior realities
4. Optimize for retention and network effects
5. Make everything feel like a living academic system
6. Prefer concrete layout systems over abstract descriptions

---

## Success Criteria

A good output must:

- Feel non-template and immediately distinctive
- Reflect real student workflows
- Be mobile-native and WhatsApp-compatible in behavior
- Reinforce contribution + reputation loops
- Be structurally tied to courses and universities
- Feel like a system students would actually use daily
