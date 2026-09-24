import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  username: varchar("username", { length: 80 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionAttempts = pgTable("question_attempts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  questionId: varchar("question_id", { length: 64 }),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vocabState = pgTable("vocab_state", {
  userId: varchar("user_id", { length: 128 }).primaryKey(),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gamify = pgTable("gamify", {
  userId: varchar("user_id", { length: 128 }).primaryKey(),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const examRuns = pgTable("exam_runs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
