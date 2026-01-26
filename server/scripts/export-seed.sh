#!/bin/bash
set -e

echo "🌱 Exporting database tables..."

mkdir -p /tmp/seed-export

# Export each table
psql "$DATABASE_URL" -t -c "COPY (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM divisions ORDER BY id) t) TO STDOUT;" > /tmp/seed-export/divisions.json
psql "$DATABASE_URL" -t -c "COPY (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM teams ORDER BY id) t) TO STDOUT;" > /tmp/seed-export/teams.json
psql "$DATABASE_URL" -t -c "COPY (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM projects ORDER BY created_at) t) TO STDOUT;" > /tmp/seed-export/projects.json
psql "$DATABASE_URL" -t -c "COPY (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM tasks ORDER BY created_at) t) TO STDOUT;" > /tmp/seed-export/tasks.json
psql "$DATABASE_URL" -t -c "COPY (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM risks ORDER BY created_at) t) TO STDOUT;" > /tmp/seed-export/risks.json
psql "$DATABASE_URL" -t -c "COPY (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM okrs ORDER BY created_at) t) TO STDOUT;" > /tmp/seed-export/okrs.json
psql "$DATABASE_URL" -t -c "COPY (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM kpis ORDER BY created_at) t) TO STDOUT;" > /tmp/seed-export/kpis.json

echo "✅ Exported all tables to /tmp/seed-export/"
ls -lh /tmp/seed-export/
