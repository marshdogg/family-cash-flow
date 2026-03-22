-- Add optional recurring contribution fields to planned_events
ALTER TABLE planned_events
  ADD COLUMN IF NOT EXISTS contribution_amount    numeric(12,2),
  ADD COLUMN IF NOT EXISTS contribution_frequency text
    CHECK (contribution_frequency IS NULL OR contribution_frequency IN ('weekly','biweekly','semimonthly','monthly','quarterly','annually'));
