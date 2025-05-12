import os
from sqlmodel import create_engine, SQLModel, Session
from contextlib import contextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# Connection parameters
engine = create_engine(DATABASE_URL, echo=False)  # echo=False disables SQL query logging

def create_db_and_tables():
    """
    Create database tables based on SQLModel metadata.
    Note: With Alembic integration, this is mostly useful for initial setup
    or testing environments. For production, use Alembic migrations.
    """
    # This creates all tables that don't exist yet - but doesn't handle migrations
    # That's why we need Alembic for proper migration management
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency for FastAPI to inject database sessions."""
    with Session(engine) as session:
        yield session

@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations."""
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close() 