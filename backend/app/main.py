from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

# Import models here to ensure they are registered with SQLModel metadata
from . import models # This line is important
from .database import create_db_and_tables, engine # Import engine if needed elsewhere, or just the function
from .routers import entries # Import the entries router
from .routers import auth # Import auth router
from .routers import admin # Import admin router
from .routers import journals # Import journals router
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
        admin_user = crud.get_user_by_username(session, "admin")
        if not admin_user:
            print("Creating default admin user...")
            # Create admin user
            admin_user = models.User(
                username="admin",
                email="admin@example.com",
                name="Administrator",
                role=models.UserRole.ADMIN,
                hashed_password=get_password_hash("admin")
            )
            session.add(admin_user)
            session.commit()
            print("Default admin user created.")
        else:
            print("Admin user already exists.")
    
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

@app.get("/")
def read_root():
    return {"message": "Journal API is running!"}

# Later we will include routers here
# from .routers import entries, auth
# app.include_router(entries.router)
# app.include_router(auth.router) 