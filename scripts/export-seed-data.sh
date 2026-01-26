#!/bin/bash
# Export current database to seed file

set -e

echo "🌱 Exporting database to seed file..."

OUTPUT_FILE="server/seed-data.json"

# Create JSON object with all tables
psql "$DATABASE_URL" -t -A -c "
SELECT json_build_object(
  'divisions', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM divisions ORDER BY id) t),
  'teams', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM teams ORDER BY id) t),
  'projects', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM projects ORDER BY created_at) t),
  'tasks', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM tasks ORDER BY created_at) t),
  'risks', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM risks ORDER BY created_at) t),
  'okrs', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM okrs ORDER BY created_at) t),
  'kpis', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM kpis ORDER BY created_at) t),
  'exported_at', NOW(),
  'total_records', (
    SELECT json_build_object(
      'divisions', (SELECT COUNT(*) FROM divisions),
      'teams', (SELECT COUNT(*) FROM teams),
      'projects', (SELECT COUNT(*) FROM projects),
      'tasks', (SELECT COUNT(*) FROM tasks),
      'risks', (SELECT COUNT(*) FROM risks),
      'okrs', (SELECT COUNT(*) FROM okrs),
      'kpis', (SELECT COUNT(*) FROM kpis)
    )
  )
);" > "$OUTPUT_FILE"

# Pretty print the JSON
echo "📝 Formatting JSON..."
if command -v jq &> /dev/null; then
  jq '.' "$OUTPUT_FILE" > "${OUTPUT_FILE}.tmp" && mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"
  echo "✅ Seed data exported to $OUTPUT_FILE (formatted with jq)"
else
  echo "✅ Seed data exported to $OUTPUT_FILE (install jq for pretty formatting)"
fi

# Show summary
echo ""
echo "📊 Export Summary:"
if command -v jq &> /dev/null; then
  jq '.total_records' "$OUTPUT_FILE"
else
  grep -o '"total_records":{[^}]*}' "$OUTPUT_FILE"
fi

echo ""
echo "✅ Done! Use 'npm run seed' to load this data into a new database."
