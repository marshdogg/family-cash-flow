-- Investments table
CREATE TABLE IF NOT EXISTS investments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name            text NOT NULL,
  category        text NOT NULL DEFAULT 'other'
    CHECK (category IN ('rrsp','tfsa','resp','brokerage','realestate','crypto','other')),
  amount          numeric(12,2) NOT NULL,
  frequency       text NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly','biweekly','semimonthly','monthly','quarterly','annually','one-time')),
  next_date       date NOT NULL,
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all investments" ON investments FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_investments_household ON investments (household_id);
