from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# Connection parameters
engine = create_engine(DATABASE_URL, echo=True)

with engine.connect() as connection:
    # Begin a transaction
    transaction = connection.begin()
    try:
        # Get all tables except alembic_version
        result = connection.execute(text("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename != 'alembic_version'
        """))
        
        tables = [row[0] for row in result]
        print(f"Found tables to clear: {tables}")
        
        # Disable foreign key checks for the transaction
        connection.execute(text("SET CONSTRAINTS ALL DEFERRED"))
        
        # Truncate all tables in a single transaction (cascade will handle dependencies)
        for table in tables:
            print(f"Truncating table: {table}")
            connection.execute(text(f'TRUNCATE TABLE "{table}" CASCADE'))
        
        # Commit the transaction
        transaction.commit()
        print("✅ Database cleared successfully!")
        
    except Exception as e:
        # Roll back the transaction if there's an error
        transaction.rollback()
        print(f"❌ Error clearing database: {e}")
        raise 