-- Add semimonthly to frequency constraints
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_frequency_check;
ALTER TABLE bills ADD CONSTRAINT bills_frequency_check
  CHECK (frequency IN ('weekly','biweekly','semimonthly','monthly','quarterly','annually','one-time'));

ALTER TABLE income_sources DROP CONSTRAINT IF EXISTS income_sources_frequency_check;
ALTER TABLE income_sources ADD CONSTRAINT income_sources_frequency_check
  CHECK (frequency IN ('weekly','biweekly','semimonthly','monthly','quarterly','annually','one-time'));
