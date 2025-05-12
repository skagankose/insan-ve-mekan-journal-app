from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

# Import models here to ensure they are registered with SQLModel metadata
from . import models # This line is important
from .database import create_db_and_tables, engine, get_session # Import engine if needed elsewhere, or just the function
from .routers import entries # Import the entries router
from .routers import auth # Import auth router
from .routers import admin # Import admin router
from .routers import journals # Import journals router
from .routers import editors # Import editors router
from . import crud
from .security import get_password_hash

@asynccontextmanager
async def lifecycle(app: FastAPI):
    # Code to run on startup
    print("Creating database and tables...")
    # For development convenience: create tables if they don't exist
    # Note: In production, you should use Alembic migrations instead
    # Run `alembic upgrade head` before starting the application
    create_db_and_tables()
    print("Database and tables created.")
    
    # Create default admin user if it doesn't exist
    with Session(engine) as session:
        # Check if admin user already exists
        admin_user = crud.get_user_by_email(session, "admin@admin.com")
        if not admin_user:
            print("Creating default admin user...")
            # Create admin user
            admin_user = models.User(
                email="admin@admin.com",
                name="Administrator",
                role=models.UserRole.admin,
                hashed_password=get_password_hash("admin")
            )
            session.add(admin_user)
            session.commit()
            print("Default admin user created.")
        else:
            print("Admin user already exists.")
        
        # Create initial settings if they don't exist
        settings = crud.get_settings(session)
        if not settings:
            print("Creating initial settings...")
            settings = crud.create_settings(session)
            print("Initial settings created.")
        else:
            print("Settings already exist.")
    
    yield
    
    # Code to run on shutdown (if any)
    print("Shutting down...")

app = FastAPI(lifespan=lifecycle)

# CORS configuration
origins = [
    "http://localhost",          # Allow requests from localhost (general)
    "http://localhost:5173",     # Allow requests from Vite dev server
    # Add any other origins if needed (e.g., your deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # List of allowed origins
    allow_credentials=True,      # Allow cookies
    allow_methods=["*"],         # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],         # Allow all headers
)

app.include_router(entries.router) # Include the entries router
app.include_router(auth.router) # Include auth router
app.include_router(admin.router) # Include admin router
app.include_router(journals.router) # Include journals router
app.include_router(editors.router) # Include editors router

# Public endpoint for published journals (no auth required)
@app.get("/public/journals", response_model=list[models.Journal])
def get_published_journals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """
    Get all published journals. This endpoint is publicly accessible without authentication.
    """
    statement = select(models.Journal).where(models.Journal.is_published == True).offset(skip).limit(limit)
    journals = db.exec(statement).all()
    return journals

# Public endpoint for entries of a published journal (no auth required)
@app.get("/public/journals/{journal_id}/entries", response_model=list[models.JournalEntry])
def get_published_journal_entries(
    journal_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """
    Get entries for a published journal. This endpoint is publicly accessible without authentication.
    """
    # First verify the journal exists and is published
    journal_statement = select(models.Journal).where(
        models.Journal.id == journal_id,
        models.Journal.is_published == True
    )
    journal = db.exec(journal_statement).first()
    
    if not journal:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Published journal not found")
    
    # Get entries for this journal
    entries_statement = select(models.JournalEntry).where(
        models.JournalEntry.journal_id == journal_id,
        models.JournalEntry.status == "completed"  # Changed from "COMPLETED" to "completed"
    ).offset(skip).limit(limit)
    
    entries = db.exec(entries_statement).all()
    return entries

@app.get("/")
def read_root():
    return {"message": "Journal API is running!"}

# Later we will include routers here
# from .routers import entries, auth
# app.include_router(entries.router)
# app.include_router(auth.router) 