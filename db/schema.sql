CREATE TABLE IF NOT EXISTS weeks (
  id SERIAL PRIMARY KEY,
  week_start DATE UNIQUE NOT NULL
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
  name TEXT NOT NULL,
  time_slot TEXT,
  is_commute BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending',
  felt TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_week_id ON sessions(week_id);
CREATE INDEX IF NOT EXISTS idx_office_days_week_id ON office_days(week_id);
