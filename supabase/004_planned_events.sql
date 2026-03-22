-- Planned Events (trips, camps, seasonal expenses)
CREATE TABLE IF NOT EXISTS planned_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name            text NOT NULL,
  category        text NOT NULL DEFAULT 'other'
    CHECK (category IN ('trip','camp','holiday','school','car','home','medical','other')),
  amount          numeric(12,2) NOT NULL,
  target_date     date NOT NULL,
  saved_so_far    numeric(12,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'saving'
    CHECK (status IN ('saving','funded','spent')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE planned_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all planned_events" ON planned_events FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_planned_events_household ON planned_events (household_id, target_date);
