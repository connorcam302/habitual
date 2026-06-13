CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  profile JSONB NOT NULL,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weeks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS office_days (
  id SERIAL PRIMARY KEY,
  week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  UNIQUE (week_id, day)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  name TEXT NOT NULL,
  time_slot TEXT,
  is_commute BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending',
  felt TEXT,
  notes TEXT,
  brief TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS brief TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_week_id ON sessions(week_id);
CREATE INDEX IF NOT EXISTS idx_office_days_week_id ON office_days(week_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token_hash ON api_tokens(token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weeks_user_week_start ON weeks(user_id, week_start);
