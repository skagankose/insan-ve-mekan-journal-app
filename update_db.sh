#!/bin/bash
# This script applies the database table rename from "user" to "users"

# Get the name of the database container
DB_CONTAINER=$(docker ps | grep postgres | awk '{print $1}')

if [ -z "$DB_CONTAINER" ]; then
  echo "Error: PostgreSQL container not found. Make sure the database container is running."
  exit 1
fi

# Get database configuration from environment or use defaults
DB_NAME=${DB_NAME:-postgres}
DB_USER=${DB_USER:-postgres}

echo "Applying migration to rename 'user' table to 'users'"

# Copy the SQL file to the container
docker cp ./backend/rename_user_to_users.sql $DB_CONTAINER:/tmp/

# Execute the SQL file
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -f /tmp/rename_user_to_users.sql

echo "Migration completed" 