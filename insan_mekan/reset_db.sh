#!/bin/bash
# This script removes all tables and migration records from the database

# Get the name of the database container
DB_CONTAINER=$(docker ps | grep postgres | awk '{print $1}')

if [ -z "$DB_CONTAINER" ]; then
  echo "Error: PostgreSQL container not found. Make sure the database container is running."
  exit 1
fi

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
  source .env
fi

# Set database configuration from environment or use defaults
DB_NAME=${POSTGRES_DB:-postgres}
DB_USER=${POSTGRES_USER:-postgres}

echo "Dropping all tables and resetting migration data..."

# Create SQL to drop all tables and remove migration history
cat > ./reset_db.sql << EOL
-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Get all table names except for alembic_version
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'alembic_version')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;

-- Also drop the alembic_version table to reset migrations
DROP TABLE IF EXISTS alembic_version;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
EOL

# Copy the SQL file to the container
docker cp ./reset_db.sql $DB_CONTAINER:/tmp/

# Execute the SQL file
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -f /tmp/reset_db.sql

# Remove the temporary SQL file
rm ./reset_db.sql

echo "Database reset completed successfully. All tables and migration records have been removed." 