-- ============================================
-- CHECK FOR BRITISH INSURANCE REFERENCES
-- ============================================
-- Run this BEFORE the cleanup script to see what will be changed

-- British Company Names
SELECT 'PROJECTS - British Companies' as category, COUNT(*) as count
FROM projects
WHERE
  name LIKE '%Legal%General%' OR
  name LIKE '%L&G%' OR
  name LIKE '%Phoenix%' OR
  description LIKE '%Legal%General%' OR
  description LIKE '%L&G%' OR
  description LIKE '%Phoenix%';

-- UK References
SELECT 'PROJECTS - UK References' as category, COUNT(*) as count
FROM projects
WHERE
  name LIKE '%UK %' OR
  name LIKE '%British%' OR
  description LIKE '%UK %' OR
  description LIKE '%British%' OR
  description LIKE '%FCA%' OR
  description LIKE '%FTSE%';

-- Pension/PRT References
SELECT 'PROJECTS - Pension/PRT' as category, COUNT(*) as count
FROM projects
WHERE
  name LIKE '%PRT%' OR
  name LIKE '%pension%' OR
  name LIKE '%Pension%' OR
  name LIKE '%annuity%' OR
  description LIKE '%PRT%' OR
  description LIKE '%pension%' OR
  description LIKE '%Pension%' OR
  description LIKE '%annuity%';

-- Insurance Terminology
SELECT 'PROJECTS - Insurance Terms' as category, COUNT(*) as count
FROM projects
WHERE
  name LIKE '%Longevity%' OR
  name LIKE '%Mortality%' OR
  name LIKE '%Actuarial%' OR
  description LIKE '%longevity%' OR
  description LIKE '%mortality%' OR
  description LIKE '%actuarial%' OR
  description LIKE '%Solvency II%';

-- Currency (GBP/£)
SELECT 'PROJECTS - GBP Currency' as category, COUNT(*) as count
FROM projects
WHERE
  description LIKE '%£%' OR
  description LIKE '%GBP%' OR
  description LIKE '%pounds%';

-- RISKS table
SELECT 'RISKS - British References' as category, COUNT(*) as count
FROM risks
WHERE
  description LIKE '%Legal%General%' OR
  description LIKE '%Phoenix%' OR
  description LIKE '%£%' OR
  description LIKE '%GBP%' OR
  mitigation LIKE '%Legal%General%' OR
  mitigation LIKE '%Phoenix%' OR
  mitigation LIKE '%£%' OR
  mitigation LIKE '%GBP%';

-- TASKS table
SELECT 'TASKS - British References' as category, COUNT(*) as count
FROM tasks
WHERE
  title LIKE '%PRT%' OR
  title LIKE '%pension%' OR
  description LIKE '%PRT%' OR
  description LIKE '%pension%' OR
  description LIKE '%£%' OR
  description LIKE '%GBP%';

-- OKRs table
SELECT 'OKRS - British References' as category, COUNT(*) as count
FROM okrs
WHERE
  title LIKE '%Legal%General%' OR
  title LIKE '%Phoenix%' OR
  description LIKE '%Legal%General%' OR
  description LIKE '%Phoenix%' OR
  description LIKE '%£%' OR
  description LIKE '%GBP%';

-- Sample records to review
SELECT 'SAMPLE PROJECTS' as info, name, LEFT(description, 100) as description_preview
FROM projects
WHERE
  name LIKE '%Legal%General%' OR
  name LIKE '%Phoenix%' OR
  name LIKE '%PRT%' OR
  name LIKE '%pension%' OR
  description LIKE '%£%' OR
  description LIKE '%GBP%'
LIMIT 10;
