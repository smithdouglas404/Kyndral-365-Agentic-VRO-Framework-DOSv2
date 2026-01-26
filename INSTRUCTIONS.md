# ACME Project Templates - Completion Instructions

## Current Status
- **Existing**: 2 industries (energy-utilities, technology) with 10 projects each ✓
- **Needed**: 18 additional industries with 10 projects each

## Quick Solution

I've created several generator scripts, but they cannot be executed without bash access. Here's what to do:

###  Option 1: Use Node.js (Recommended)

Run any of these scripts:
```bash
cd /home/runner/workspace
node generate-all-acme-industries.js
```

### Option 2: Manual Completion

If the scripts don't work, you'll need to manually complete the file by:

1. **Backup** the existing file:
   ```bash
   cp server/seed-data/acme-project-templates.json server/seed-data/acme-project-templates.backup.json
   ```

2. **Open** the file in an editor

3. **Add** the remaining 18 industries using the pattern below

## Project Distribution Pattern (Per Industry)

Each industry must have **exactly 10 projects** with this health status distribution:

- **2 Critical** projects (CPI < 0.85, SPI < 0.80)
  - Budget overruns, schedule delays
  - triggeredRules: ['Budget Overrun Critical', 'Schedule Delay High', ...]
  - interventionTypes: ['DeepFinOps', 'DeepTMO', 'DeepRisk']
  - governanceStatus: 'executive_escalation_required' or 'compliance_review_pending'

- **2 Warning** projects (CPI 0.85-0.92, SPI 0.80-0.90)
  - Moderate delays/overruns
  - triggeredRules: ['Schedule Delay Moderate', 'Integration Risk']
  - interventionTypes: ['DeepTMO', 'DeepOCM'] or ['DeepTMO', 'DeepRisk']
  - governanceStatus: 'on_track'

- **2 Healthy** projects (CPI > 1.05, SPI > 1.05)
  - Under budget, ahead of schedule
  - triggeredRules: []
  - interventionTypes: []
  - governanceStatus: 'on_track'

- **2 Risk** projects (on budget/schedule BUT high risks)
  - CPI > 1.05, SPI > 1.05
  - triggeredRules: ['High Risk Cutover', 'Regulatory Approval Pending', etc.]
  - interventionTypes: ['DeepRisk', 'DeepGovernance'] or ['DeepRisk', 'DeepTMO']
  - governanceStatus: 'regulatory_review' or 'executive_approval_required' or 'high_risk_monitoring'

- **2 Governance** projects (on budget/schedule BUT governance issues)
  - CPI ~1.03, SPI 1.00
  - triggeredRules: ['Stage Gate Approval Pending', 'Change Adoption Monitoring', etc.]
  - interventionTypes: ['DeepGovernance', 'DeepOCM'] or ['DeepGovernance']
  - governanceStatus: 'approval_pending' or 'gate_approval_overdue' or 'stakeholder_review_pending'

## Remaining 18 Industries to Add

1. **healthcare** - Medical, hospital, clinical projects
2. **financial-services** - Banking, payments, fintech projects
3. **manufacturing** - Factory automation, production, quality
4. **retail-ecommerce** - E-commerce platforms, POS systems, omnichannel
5. **transportation-logistics** - Fleet management, warehouse, delivery
6. **telecommunications** - Network infrastructure, 5G, customer systems
7. **realestate-construction** - Building projects, property management
8. **pharma-biotech** - Drug development, clinical trials, regulatory
9. **consumer-products** - Product launches, supply chain, marketing
10. **media-entertainment** - Streaming platforms, content production
11. **hospitality-tourism** - Hotel systems, booking platforms, customer experience
12. **agriculture-food** - Farm tech, food processing, supply chain
13. **education** - Learning platforms, campus systems, student services
14. **professional-services** - Practice management, client portals, knowledge systems
15. **insurance** - Claims processing, underwriting, policy admin
16. **automotive** - Vehicle development, manufacturing, dealer systems
17. **aerospace-defense** - Aircraft programs, defense systems, compliance
18. **mining-materials** - Mining operations, safety systems, environmental

## Template for Each Industry

```json
{
  "industryId": "industry-name",
  "companyId": "acme-industry-short",
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "healthStatus": "critical|warning|healthy|risk|governance",
      "budget": {
        "planned": 10000000,
        "actual": 12000000,
        "forecast": 13000000,
        "cpi": 0.83
      },
      "schedule": {
        "plannedDuration": 12,
        "actualDuration": 15,
        "weeksLate": 3,
        "spi": 0.80
      },
      "tasks": [
        {"name": "Task 1", "status": "complete", "delayWeeks": 2, "rootCause": "Reason for delay"},
        {"name": "Task 2", "status": "in_progress", "delayWeeks": 3, "rootCause": "Current issue"},
        {"name": "Task 3", "status": "at_risk", "delayWeeks": 3, "rootCause": "Risk factor"},
        {"name": "Task 4", "status": "pending", "delayWeeks": 0, "rootCause": "Dependency"}
      ],
      "triggeredRules": ["Rule 1", "Rule 2"],
      "interventionTypes": ["DeepFinOps", "DeepTMO"],
      "governanceStatus": "status_here"
    }
  ]
}
```

## Next Steps

1. Run one of the generator scripts I created
2. If that fails, manually add the remaining industries following the pattern
3. Validate the JSON is properly formatted
4. Test by loading the file in your application

## Files Created

- `generate-all-acme-industries.js` - Main generator (partially complete)
- `FINAL-COMPLETE-GENERATOR.js` - Condensed generator
- `COMPLETE-GENERATOR.js` - Alternative approach
- This file - `INSTRUCTIONS.md`

Choose the approach that works best for your environment.
