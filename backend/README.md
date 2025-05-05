# Backend

## Setup and Migrations

### Setting up the database

The project uses Alembic for database migrations. To set up and run migrations:

1. Make sure you have all dependencies installed:
```bash
pip install -r requirements.txt
```

2. Initialize the migrations (first time only):
```bash
cd backend
alembic init alembic  # This has already been done in the repository
```

3. Create a migration after changing models:
```bash
cd backend
alembic revision --autogenerate -m "describe your changes"
```

4. Apply migrations:
```bash
cd backend
alembic upgrade head
```

### Resetting the database

To completely reset the database and run migrations from scratch:

1. Connect to the database container:
```bash
docker exec -it insan_mekan-postgres-1 bash
```

2. Access the PostgreSQL command line:
```bash
psql -U postgres
```

3. Drop and recreate the database:
```sql
DROP DATABASE your_db_name;
CREATE DATABASE your_db_name;
\q
```

4. Connect to the backend container:
```bash
docker exec -it insan_mekan-backend-1 bash
```

5. Apply migrations:
```bash
cd /app
alembic upgrade head
```

### Running the Application

The application will automatically create tables if they don't exist when it starts, but for proper schema management, always run migrations before starting the application in production environments. 