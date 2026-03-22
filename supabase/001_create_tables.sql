-- ============================================
-- Family Cash Flow — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Households
CREATE TABLE IF NOT EXISTS households (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL DEFAULT 'Our Household',
  min_balance     numeric(12,2) NOT NULL DEFAULT 500,
  cadence         text NOT NULL DEFAULT 'weekly'
    CHECK (cadence IN ('weekly','biweekly','monthly')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all households" ON households FOR ALL USING (true) WITH CHECK (true);

-- 2. Bills & Expenses
CREATE TABLE IF NOT EXISTS bills (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name            text NOT NULL,
  category        text NOT NULL DEFAULT 'other'
    CHECK (category IN ('housing','utilities','insurance','transport','groceries','childcare','subscriptions','loan','other')),
  amount          numeric(12,2) NOT NULL,
  frequency       text NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly','biweekly','monthly','quarterly','annually','one-time')),
  next_date       date NOT NULL,
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all bills" ON bills FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_bills_household ON bills (household_id, next_date);

-- 3. Income Sources
CREATE TABLE IF NOT EXISTS income_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name            text NOT NULL,
  category        text NOT NULL DEFAULT 'paycheck'
    CHECK (category IN ('paycheck','bonus','side','benefits','refund','other')),
  amount          numeric(12,2) NOT NULL,
  frequency       text NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly','biweekly','monthly','quarterly','annually','one-time')),
  next_date       date NOT NULL,
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expected')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all income" ON income_sources FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_income_household ON income_sources (household_id);

-- 4. Check-Ins (Weekly Rituals)
CREATE TABLE IF NOT EXISTS check_ins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  bank_balance    numeric(12,2) NOT NULL,
  weekly_income   numeric(12,2),
  weekly_expenses numeric(12,2),
  weekly_net      numeric(12,2),
  projected_12wk  numeric(12,2),
  week_start      date NOT NULL,
  completed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all check_ins" ON check_ins FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_checkins_household ON check_ins (household_id, completed_at);

-- 5. Seed a default household
INSERT INTO households (id, name, min_balance, cadence)
VALUES ('00000000-0000-0000-0000-000000000001', 'Our Household', 500, 'weekly')
ON CONFLICT (id) DO NOTHING;
