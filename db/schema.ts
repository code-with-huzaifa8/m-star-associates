import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const properties = sqliteTable("properties", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  published: integer("published").notNull().default(0),
  created_at: text("created_at").notNull(),
});
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  data: text("data").notNull(),
  status: text("status").notNull().default("New"),
  created_at: text("created_at").notNull(),
});
export const content = sqliteTable("content", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  slug: text("slug").notNull(),
  data: text("data").notNull(),
  published: integer("published").notNull().default(0),
  created_at: text("created_at").notNull(),
});
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
export const admins = sqliteTable("admins", {
  user_id: text("user_id").primaryKey(),
  email: text("email"),
  name: text("name"),
  role: text("role").notNull(),
});
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mime: text("mime").notNull(),
  created_at: text("created_at").notNull(),
});
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expires: integer("expires").notNull(),
});
