-- ============================================
-- CONVERT BRITISH INSURANCE DATA TO ACME (USD)
-- ============================================
-- This script replaces all British insurance references with generic ACME company
-- and converts all currency references from GBP (£) to USD ($)

BEGIN;

-- ============================================
-- PART 1: REPLACE COMPANY NAMES
-- ============================================

-- Legal & General → ACME Corporation
UPDATE projects SET
  name = REPLACE(name, 'Legal & General', 'ACME Corporation'),
  name = REPLACE(name, 'Legal and General', 'ACME Corporation'),
  name = REPLACE(name, 'L&G', 'ACME'),
  description = REPLACE(description, 'Legal & General', 'ACME Corporation'),
  description = REPLACE(description, 'Legal and General', 'ACME Corporation'),
  description = REPLACE(description, 'L&G', 'ACME')
WHERE
  name LIKE '%Legal%General%' OR
  name LIKE '%L&G%' OR
  description LIKE '%Legal%General%' OR
  description LIKE '%L&G%';

-- Phoenix Group → ACME Financial
UPDATE projects SET
  name = REPLACE(name, 'Phoenix Group', 'ACME Financial'),
  name = REPLACE(name, 'Phoenix', 'ACME Financial'),
  description = REPLACE(description, 'Phoenix Group', 'ACME Financial'),
  description = REPLACE(description, 'Phoenix', 'ACME Financial')
WHERE
  name LIKE '%Phoenix%' OR
  description LIKE '%Phoenix%';

-- Update other tables with company names
UPDATE risks SET
  description = REPLACE(description, 'Legal & General', 'ACME Corporation'),
  description = REPLACE(description, 'L&G', 'ACME'),
  description = REPLACE(description, 'Phoenix Group', 'ACME Financial'),
  mitigation = REPLACE(mitigation, 'Legal & General', 'ACME Corporation'),
  mitigation = REPLACE(mitigation, 'L&G', 'ACME'),
  mitigation = REPLACE(mitigation, 'Phoenix Group', 'ACME Financial')
WHERE
  description LIKE '%Legal%General%' OR
  description LIKE '%L&G%' OR
  description LIKE '%Phoenix%' OR
  mitigation LIKE '%Legal%General%' OR
  mitigation LIKE '%L&G%' OR
  mitigation LIKE '%Phoenix%';

UPDATE okrs SET
  title = REPLACE(title, 'Legal & General', 'ACME Corporation'),
  title = REPLACE(title, 'L&G', 'ACME'),
  title = REPLACE(title, 'Phoenix Group', 'ACME Financial'),
  description = REPLACE(description, 'Legal & General', 'ACME Corporation'),
  description = REPLACE(description, 'L&G', 'ACME'),
  description = REPLACE(description, 'Phoenix Group', 'ACME Financial')
WHERE
  title LIKE '%Legal%General%' OR
  title LIKE '%L&G%' OR
  title LIKE '%Phoenix%' OR
  description LIKE '%Legal%General%' OR
  description LIKE '%L&G%' OR
  description LIKE '%Phoenix%';

-- ============================================
-- PART 2: REPLACE UK/BRITISH REFERENCES
-- ============================================

UPDATE projects SET
  name = REPLACE(name, 'UK ', 'US '),
  name = REPLACE(name, 'British', 'American'),
  description = REPLACE(description, 'UK ', 'US '),
  description = REPLACE(description, 'British', 'American'),
  description = REPLACE(description, 'FCA', 'SEC'),
  description = REPLACE(description, 'Financial Conduct Authority', 'Securities and Exchange Commission')
WHERE
  name LIKE '%UK %' OR
  name LIKE '%British%' OR
  description LIKE '%UK %' OR
  description LIKE '%British%' OR
  description LIKE '%FCA%';

-- ============================================
-- PART 3: REPLACE PENSION/PRT TERMINOLOGY
-- ============================================

UPDATE projects SET
  name = REPLACE(name, 'PRT', 'Retirement Services'),
  name = REPLACE(name, 'Pension Risk Transfer', 'Retirement Planning'),
  name = REPLACE(name, 'pension', 'retirement'),
  name = REPLACE(name, 'Pension', 'Retirement'),
  description = REPLACE(description, 'PRT', 'Retirement Services'),
  description = REPLACE(description, 'Pension Risk Transfer', 'Retirement Planning'),
  description = REPLACE(description, 'pension', 'retirement'),
  description = REPLACE(description, 'Pension', 'Retirement'),
  description = REPLACE(description, 'annuity', 'retirement account'),
  description = REPLACE(description, 'Annuity', 'Retirement Account')
WHERE
  name LIKE '%PRT%' OR
  name LIKE '%pension%' OR
  name LIKE '%Pension%' OR
  description LIKE '%PRT%' OR
  description LIKE '%pension%' OR
  description LIKE '%Pension%' OR
  description LIKE '%annuity%' OR
  description LIKE '%Annuity%';

UPDATE tasks SET
  title = REPLACE(title, 'PRT', 'Retirement Services'),
  title = REPLACE(title, 'pension', 'retirement'),
  title = REPLACE(title, 'Pension', 'Retirement'),
  description = REPLACE(description, 'PRT', 'Retirement Services'),
  description = REPLACE(description, 'pension', 'retirement'),
  description = REPLACE(description, 'Pension', 'Retirement')
WHERE
  title LIKE '%PRT%' OR
  title LIKE '%pension%' OR
  title LIKE '%Pension%' OR
  description LIKE '%PRT%' OR
  description LIKE '%pension%' OR
  description LIKE '%Pension%';

-- ============================================
-- PART 4: REPLACE INSURANCE TERMINOLOGY
-- ============================================

UPDATE projects SET
  name = REPLACE(name, 'Longevity', 'Lifecycle'),
  name = REPLACE(name, 'Mortality', 'Demographics'),
  name = REPLACE(name, 'Actuarial', 'Financial Analytics'),
  description = REPLACE(description, 'longevity', 'lifecycle'),
  description = REPLACE(description, 'Longevity', 'Lifecycle'),
  description = REPLACE(description, 'mortality', 'demographics'),
  description = REPLACE(description, 'Mortality', 'Demographics'),
  description = REPLACE(description, 'actuarial', 'financial analytics'),
  description = REPLACE(description, 'Actuarial', 'Financial Analytics'),
  description = REPLACE(description, 'Solvency II', 'Financial Compliance'),
  description = REPLACE(description, 'bulk annuity', 'financial product')
WHERE
  name LIKE '%Longevity%' OR
  name LIKE '%Mortality%' OR
  name LIKE '%Actuarial%' OR
  description LIKE '%longevity%' OR
  description LIKE '%Longevity%' OR
  description LIKE '%mortality%' OR
  description LIKE '%Mortality%' OR
  description LIKE '%actuarial%' OR
  description LIKE '%Actuarial%' OR
  description LIKE '%Solvency II%' OR
  description LIKE '%bulk annuity%';

-- ============================================
-- PART 5: CONVERT CURRENCY (£ GBP → $ USD)
-- ============================================

-- Replace currency symbols
UPDATE projects SET
  description = REPLACE(description, '£', '$'),
  description = REPLACE(description, 'GBP', 'USD'),
  description = REPLACE(description, 'pounds', 'dollars'),
  description = REPLACE(description, 'Pounds', 'Dollars')
WHERE
  description LIKE '%£%' OR
  description LIKE '%GBP%' OR
  description LIKE '%pounds%' OR
  description LIKE '%Pounds%';

UPDATE risks SET
  description = REPLACE(description, '£', '$'),
  description = REPLACE(description, 'GBP', 'USD'),
  mitigation = REPLACE(mitigation, '£', '$'),
  mitigation = REPLACE(mitigation, 'GBP', 'USD')
WHERE
  description LIKE '%£%' OR
  description LIKE '%GBP%' OR
  mitigation LIKE '%£%' OR
  mitigation LIKE '%GBP%';

UPDATE tasks SET
  description = REPLACE(description, '£', '$'),
  description = REPLACE(description, 'GBP', 'USD')
WHERE
  description LIKE '%£%' OR
  description LIKE '%GBP%';

UPDATE okrs SET
  description = REPLACE(description, '£', '$'),
  description = REPLACE(description, 'GBP', 'USD')
WHERE
  description LIKE '%£%' OR
  description LIKE '%GBP%';

UPDATE kpis SET
  description = REPLACE(description, '£', '$'),
  description = REPLACE(description, 'GBP', 'USD')
WHERE
  description LIKE '%£%' OR
  description LIKE '%GBP%';

-- ============================================
-- PART 6: UPDATE BUSINESS UNITS
-- ============================================

UPDATE divisions SET
  name = REPLACE(name, 'Retirement', 'Financial Services'),
  name = REPLACE(name, 'Institutional Retirement', 'Enterprise Services'),
  description = REPLACE(description, 'retirement', 'financial services'),
  description = REPLACE(description, 'Retirement', 'Financial Services')
WHERE
  name LIKE '%Retirement%' OR
  description LIKE '%retirement%' OR
  description LIKE '%Retirement%';

-- ============================================
-- PART 7: CLEAN UP SPECIFIC UK TERMS
-- ============================================

UPDATE projects SET
  description = REPLACE(description, 'FTSE 350', 'S&P 500'),
  description = REPLACE(description, 'FTSE', 'S&P'),
  description = REPLACE(description, 'UK hospital', 'US hospital'),
  description = REPLACE(description, 'UK resident', 'US resident'),
  description = REPLACE(description, 'CMI mortality', 'demographic data')
WHERE
  description LIKE '%FTSE%' OR
  description LIKE '%UK hospital%' OR
  description LIKE '%UK resident%' OR
  description LIKE '%CMI%';

-- ============================================
-- SUMMARY QUERY
-- ============================================

-- Check for any remaining British references
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM (
    SELECT id FROM projects WHERE
      name LIKE '%Legal%General%' OR
      name LIKE '%Phoenix%' OR
      name LIKE '%£%' OR
      description LIKE '%Legal%General%' OR
      description LIKE '%Phoenix%' OR
      description LIKE '%£%' OR
      description LIKE '%GBP%' OR
      description LIKE '%UK %' OR
      description LIKE '%British%'
    UNION ALL
    SELECT id FROM risks WHERE
      description LIKE '%Legal%General%' OR
      description LIKE '%Phoenix%' OR
      description LIKE '%£%' OR
      description LIKE '%GBP%'
    UNION ALL
    SELECT id FROM tasks WHERE
      description LIKE '%Legal%General%' OR
      description LIKE '%Phoenix%' OR
      description LIKE '%£%' OR
      description LIKE '%GBP%'
  ) AS remaining;

  RAISE NOTICE 'Cleanup complete. Remaining British references: %', remaining_count;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (Run separately)
-- ============================================

-- SELECT name, description FROM projects WHERE name LIKE '%ACME%' OR description LIKE '%ACME%';
-- SELECT COUNT(*) as acme_projects FROM projects WHERE name LIKE '%ACME%' OR description LIKE '%ACME%';
-- SELECT description FROM projects WHERE description LIKE '%$%' LIMIT 10;
-- SELECT name, description FROM projects WHERE name LIKE '%Retirement Services%' OR description LIKE '%Retirement Services%';
