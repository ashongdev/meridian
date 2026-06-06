import { pgTable, uuid, integer, text } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";

export const materialEmbeddings = pgTable("material_embeddings", {
  id:         uuid("id").defaultRandom().primaryKey(),
  materialId: uuid("material_id").notNull(),
  courseId:   uuid("course_id").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content:    text("content").notNull(),
  embedding:  vector("embedding", { dimensions: 1536 }),
});
