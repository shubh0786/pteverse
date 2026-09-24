CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar(128) PRIMARY KEY,
  "email" varchar(255) NOT NULL,
  "username" varchar(80),
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" varchar(64) PRIMARY KEY,
  "user_id" varchar(128) NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "question_attempts" (
  "id" varchar(64) PRIMARY KEY,
  "user_id" varchar(128) NOT NULL,
  "type" varchar(64) NOT NULL,
  "question_id" varchar(64),
  "payload" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "vocab_state" (
  "user_id" varchar(128) PRIMARY KEY,
  "payload" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "gamify" (
  "user_id" varchar(128) PRIMARY KEY,
  "payload" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "exam_runs" (
  "id" varchar(64) PRIMARY KEY,
  "user_id" varchar(128) NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "question_attempts_user_id_idx" ON "question_attempts" ("user_id");
CREATE INDEX IF NOT EXISTS "exam_runs_user_id_idx" ON "exam_runs" ("user_id");
