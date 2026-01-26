# 🌱 Database Seeding Guide

This guide explains how to seed your database with NextEra Energy test data for development, staging, and production environments.

## 📊 What Gets Seeded?

The seed data includes **real NextEra Energy structure** with rich test data:

| Table | Records | Description |
|-------|---------|-------------|
| **Divisions** | 3 | FPL, NextEra Energy Resources, Corporate & Other |
| **Teams** | 8 | Cross-divisional teams with leads and members |
| **Projects** | 74 | 36 NextEra projects + 38 generic IT projects |
| **Tasks** | 180 | Detailed task breakdowns with assignees and status |
| **Risks** | 53 | Risk assessments with severity and mitigation plans |
| **OKRs** | 6 | Quarterly objectives and key results |
| **KPIs** | 15 | Performance metrics with targets and actuals |

### 🎯 Data Quality

- ✅ **All USD currency** - No British pounds or GBP
- ✅ **NextEra Energy focused** - Real FPL and NEER projects
- ✅ **Generic IT projects** - Cloud, CRM, API Gateway, etc.
- ✅ **Rich relationships** - Projects linked to tasks, risks, OKRs, KPIs
- ✅ **Realistic values** - Budgets, progress, dates, priorities
- ✅ **Production-ready structure** - Same schema as production

## 🚀 Quick Start

### Seed a New Database

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Run database migrations (if needed)
npm run db:push

# Export current data and seed the database
npm run seed:nextera
```

### Export Current Database to Seed Files

```bash
# Export your current database state
npm run seed:export
```

This creates JSON files in `/tmp/seed-export/`:
- `divisions.json` (1.3 KB)
- `teams.json` (4.1 KB)
- `projects.json` (105 KB)
- `tasks.json` (69 KB)
- `risks.json` (22 KB)
- `okrs.json` (3.0 KB)
- `kpis.json` (9.2 KB)

## 📋 Seeding Scenarios

### Scenario 1: New Development Environment

```bash
# Fresh database - seed with test data
createdb my_dev_database
export DATABASE_URL="postgresql://localhost:5432/my_dev_database"
npm run db:push
npm run seed:nextera
```

### Scenario 2: Staging Environment

```bash
# Staging - seed with production-like data
export DATABASE_URL="postgresql://staging-host:5432/staging_db"
npm run db:push
npm run seed:nextera
```

### Scenario 3: Production Environment (NEW DEPLOYMENT)

```bash
# Production - seed initial data structure
export DATABASE_URL="postgresql://prod-host:5432/prod_db"
npm run db:push

# Option A: Start with test data (recommended for initial launch)
npm run seed:nextera

# Option B: Start empty and let Monday.com sync fill it
# (skip seeding)
```

### Scenario 4: Export Updated Data for New Environments

```bash
# After you've added custom projects/data
npm run seed:export

# Commit the updated seed files
git add /tmp/seed-export/*.json
git commit -m "Update seed data with new projects"

# Deploy to new environment and seed
npm run seed:nextera
```

## 🔧 Manual Seeding

### Step-by-Step Process

```bash
# 1. Export current database
bash server/scripts/export-seed.sh

# 2. Check exported files
ls -lh /tmp/seed-export/

# 3. Seed database from exported files
tsx server/scripts/seed-database.ts
```

### Seed Specific Tables

```bash
# Edit seed-database.ts and comment out tables you don't want
# For example, to only seed divisions and projects:

# await seedDivisions();
# await seedProjects();
# // await seedTasks();  // Skip tasks
# // await seedRisks();  // Skip risks
```

## 🔄 Continuous Integration / CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run database migrations
        run: npm run db:push
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      - name: Seed database
        run: npm run seed:nextera
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      - name: Deploy application
        run: npm run build && npm run start
```

## 🛠️ Customizing Seed Data

### Option 1: Update Database and Re-export

```bash
# 1. Make changes in your UI or directly in database
psql $DATABASE_URL

# 2. Export updated data
npm run seed:export

# 3. Commit changes
git add /tmp/seed-export/*.json
git commit -m "Update seed data"
```

### Option 2: Edit JSON Files Directly

```bash
# Edit exported files
vi /tmp/seed-export/projects.json

# Add/remove/modify records
# Then seed database
tsx server/scripts/seed-database.ts
```

### Option 3: Programmatic Seeding

Edit `server/scripts/seed-database.ts` to add custom logic:

```typescript
// Add custom projects after seeding
await db.insert(projects).values({
  id: 'custom-project-1',
  name: 'My Custom Project',
  description: 'Custom project for testing',
  status: 'active',
  // ...
});
```

## ⚠️ Important Notes

### Database Clearing

**WARNING:** `npm run seed:nextera` will **DELETE ALL EXISTING DATA** before seeding!

To preserve existing data:
1. Export before seeding: `npm run seed:export`
2. Or modify `seed-database.ts` to comment out `clearDatabase()`

### Foreign Key Constraints

The seeding script respects foreign key relationships:
1. Divisions (no dependencies)
2. Teams (depends on divisions)
3. Projects (depends on divisions, teams)
4. Tasks, Risks, OKRs, KPIs (depend on projects)

### Conflict Resolution

The script uses `.onConflictDoNothing()` - if a record with the same ID exists, it will be skipped (not updated).

## 🔍 Verification

### Check Seeded Data

```bash
# Count records
psql $DATABASE_URL -c "
  SELECT 'divisions' as table, COUNT(*) FROM divisions
  UNION ALL SELECT 'teams', COUNT(*) FROM teams
  UNION ALL SELECT 'projects', COUNT(*) FROM projects
  UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
  UNION ALL SELECT 'risks', COUNT(*) FROM risks
  UNION ALL SELECT 'okrs', COUNT(*) FROM okrs
  UNION ALL SELECT 'kpis', COUNT(*) FROM kpis;
"
```

Expected output:
```
   table    | count
------------+-------
 divisions  |     3
 teams      |     8
 projects   |    74
 tasks      |   180
 risks      |    53
 okrs       |     6
 kpis       |    15
```

### View Sample Projects

```bash
psql $DATABASE_URL -c "SELECT id, name, status, budget FROM projects LIMIT 5;"
```

## 📁 File Structure

```
.
├── package.json                          # npm scripts
├── SEEDING.md                           # This file
├── server/
│   ├── scripts/
│   │   ├── export-seed.sh              # Export database to JSON
│   │   └── seed-database.ts            # Seed database from JSON
│   └── seedData.ts                      # Original seed script
└── /tmp/seed-export/                    # Exported seed files
    ├── divisions.json
    ├── teams.json
    ├── projects.json
    ├── tasks.json
    ├── risks.json
    ├── okrs.json
    └── kpis.json
```

## 🆘 Troubleshooting

### "Could not load divisions.json"

**Cause:** Seed files don't exist yet
**Solution:** Run `npm run seed:export` first

### "Foreign key constraint violation"

**Cause:** Seeding order is wrong or data references invalid IDs
**Solution:** Check that division/team IDs in projects match actual divisions/teams

### "Database connection failed"

**Cause:** DATABASE_URL not set or incorrect
**Solution:** `export DATABASE_URL="postgresql://..."`

### "Permission denied"

**Cause:** Database user lacks create/delete permissions
**Solution:** Grant necessary permissions or use admin user for seeding

## 💡 Best Practices

1. **Version Control Seed Data**
   - Commit `/tmp/seed-export/*.json` to git
   - Update when schema changes

2. **Separate Dev/Staging/Prod Seeds**
   - Dev: Full test data (all 74 projects)
   - Staging: Subset (10-20 projects)
   - Prod: Minimal or empty (let Monday.com fill it)

3. **Automate Seeding in CI/CD**
   - Always seed staging automatically
   - Never seed production automatically (manual step)

4. **Keep Seed Data Fresh**
   - Re-export after major feature additions
   - Update quarterly or after schema changes

5. **Document Custom Changes**
   - If you manually edit JSON files, document why
   - Include comments in seed-database.ts for custom logic

## 🎓 Learn More

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL COPY Command](https://www.postgresql.org/docs/current/sql-copy.html)
- [Database Seeding Best Practices](https://www.prisma.io/docs/guides/database/seed-database)

---

**Questions?** Open an issue or contact the development team.
