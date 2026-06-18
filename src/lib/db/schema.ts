import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// Aurora DSQL limitations: no ENUM types, no foreign key constraints, no sync CREATE INDEX.
// Indexes are created separately via scripts/apply-indexes.ts (CREATE INDEX ASYNC).
// FK relationships enforced at application level.

const now = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

/* ── Universities ─────────────────────────────────────────────────────────── */
export const universities = pgTable("universities", {
  id:        uuid("id").defaultRandom().primaryKey(),
  name:      text("name").notNull(),
  slug:      text("slug").notNull().unique(),
  country:   text("country").notNull(),
  logoUrl:   text("logo_url"),
  createdAt: now(),
});

/* ── Users ────────────────────────────────────────────────────────────────── */
export const users = pgTable("users", {
  id:           uuid("id").defaultRandom().primaryKey(),
  email:        text("email").notNull().unique(),
  name:         text("name"),
  avatarUrl:    text("avatar_url"),
  universityId: uuid("university_id"),
  isPro:        boolean("is_pro").default(false).notNull(),
  trialEndsAt:  timestamp("trial_ends_at", { withTimezone: true }),
  karmaScore:   integer("karma_score").default(0).notNull(),
  createdAt:    now(),
});

/* ── Courses ──────────────────────────────────────────────────────────────── */
export const courses = pgTable("courses", {
  id:            uuid("id").defaultRandom().primaryKey(),
  universityId:  uuid("university_id").notNull(),
  code:          text("code").notNull(),
  slug:          text("slug").notNull(),
  title:         text("title").notNull(),
  description:   text("description"),
  yearLevel:     integer("year_level"),
  memberCount:   integer("member_count").default(0).notNull(),
  materialCount: integer("material_count").default(0).notNull(),
  createdAt:     now(),
});

/* ── Course memberships ───────────────────────────────────────────────────── */
export const courseMemberships = pgTable("course_memberships", {
  id:       uuid("id").defaultRandom().primaryKey(),
  userId:   uuid("user_id").notNull(),
  courseId: uuid("course_id").notNull(),
  // "member" | "moderator" | "admin"
  role:     text("role").default("member").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ── Materials ────────────────────────────────────────────────────────────── */
export const materials = pgTable("materials", {
  id:              uuid("id").defaultRandom().primaryKey(),
  courseId:        uuid("course_id").notNull(),
  uploaderId:      uuid("uploader_id"),
  title:           text("title").notNull(),
  // "past_exam" | "notes" | "syllabus" | "textbook_chapter" | "other"
  type:            text("type").notNull(),
  fileUrl:         text("file_url").notNull(),
  fileSize:        integer("file_size"),
  mimeType:        text("mime_type"),
  sha256:          text("sha256"),
  academicYear:    text("academic_year"),
  isVerified:      boolean("is_verified").default(false).notNull(),
  isAnonymous:     boolean("is_anonymous").default(false).notNull(),
  upvoteCount:     integer("upvote_count").default(0).notNull(),
  downloadCount:   integer("download_count").default(0).notNull(),
  // "pending" | "processing" | "done" | "failed"
  embeddingStatus: text("embedding_status").default("pending").notNull(),
  createdAt:       now(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt:       timestamp("deleted_at", { withTimezone: true }),
});

/* ── Posts ────────────────────────────────────────────────────────────────── */
export const posts = pgTable("posts", {
  id:           uuid("id").defaultRandom().primaryKey(),
  courseId:     uuid("course_id").notNull(),
  authorId:     uuid("author_id"),
  // "question" | "discussion" | "resource" | "announcement"
  type:         text("type").default("discussion").notNull(),
  title:        text("title"),
  content:      text("content").notNull(),
  isPinned:     boolean("is_pinned").default(false).notNull(),
  upvoteCount:  integer("upvote_count").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  createdAt:    now(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt:    timestamp("deleted_at", { withTimezone: true }),
});

/* ── Comments ─────────────────────────────────────────────────────────────── */
export const comments = pgTable("comments", {
  id:          uuid("id").defaultRandom().primaryKey(),
  postId:      uuid("post_id").notNull(),
  authorId:    uuid("author_id"),
  content:     text("content").notNull(),
  upvoteCount: integer("upvote_count").default(0).notNull(),
  createdAt:   now(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt:   timestamp("deleted_at", { withTimezone: true }),
});

/* ── Study groups ─────────────────────────────────────────────────────────── */
export const studyGroups = pgTable("study_groups", {
  id:          uuid("id").defaultRandom().primaryKey(),
  courseId:    uuid("course_id").notNull(),
  createdBy:   uuid("created_by").notNull(),
  name:        text("name").notNull(),
  description: text("description"),
  maxSize:     integer("max_size").default(8).notNull(),
  memberCount: integer("member_count").default(1).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  createdAt:   now(),
});

/* ── Study group members ──────────────────────────────────────────────────── */
export const studyGroupMembers = pgTable("study_group_members", {
  id:       uuid("id").defaultRandom().primaryKey(),
  groupId:  uuid("group_id").notNull(),
  userId:   uuid("user_id").notNull(),
  // "member" | "moderator" | "admin"
  role:     text("role").default("member").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ── Group messages ───────────────────────────────────────────────────────── */
export const groupMessages = pgTable("group_messages", {
  id:        uuid("id").defaultRandom().primaryKey(),
  groupId:   uuid("group_id").notNull(),
  userId:    uuid("user_id").notNull(),
  content:   text("content").notNull(),
  createdAt: now(),
});

/* ── AI sessions ──────────────────────────────────────────────────────────── */
export const aiSessions = pgTable("ai_sessions", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    uuid("user_id").notNull(),
  courseId:  uuid("course_id").notNull(),
  messages:  text("messages").default("[]").notNull(),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ── Promo codes ──────────────────────────────────────────────────────────── */
export const promoCodes = pgTable("promo_codes", {
  id:           uuid("id").defaultRandom().primaryKey(),
  code:         text("code").notNull().unique(),
  durationDays: integer("duration_days").notNull(),
  usageLimit:   integer("usage_limit"),
  usageCount:   integer("usage_count").default(0).notNull(),
  expiresAt:    timestamp("expires_at", { withTimezone: true }),
  createdAt:    now(),
});

/* ── Upvotes ──────────────────────────────────────────────────────────────── */
export const upvotes = pgTable("upvotes", {
  id:         uuid("id").defaultRandom().primaryKey(),
  userId:     uuid("user_id").notNull(),
  // "post" | "comment" | "material"
  targetType: text("target_type").notNull(),
  targetId:   uuid("target_id").notNull(),
  createdAt:  now(),
});
