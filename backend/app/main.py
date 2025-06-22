from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
import os
from pathlib import Path
from datetime import datetime

# Patch for bcrypt/__about__ issue
import bcrypt
if not hasattr(bcrypt, '__about__'):
    bcrypt.__about__ = type('obj', (object,), {
        '__version__': bcrypt.__version__
    })

# Import models here to ensure they are registered with SQLModel metadata
from . import models # This line is important
from .database import create_db_and_tables, engine, get_session # Import engine if needed elsewhere, or just the function
from .routers import entries # Import the entries router
from .routers import auth # Import auth router
from .routers import admin # Import admin router
from .routers import journals # Import journals router
from .routers import editors # Import editors router
from .routers import public # Import public router
from . import crud
from .security import get_password_hash
from .file_utils import UPLOAD_DIR

@asynccontextmanager
async def lifecycle(app: FastAPI):
    # Code to run on startup
    print("Creating database and tables...")
    # For development convenience: create tables if they don't exist
    # Note: In production, you should use Alembic migrations instead
    # Run `alembic upgrade head` before starting the application
    create_db_and_tables()
    print("Database and tables created.")
    
    # Create admin user if it doesn't exist and ADMIN creds are provided
    admin_email = os.getenv("ADMIN_EMAIL", "admin@admin.com")  # Default admin email
    admin_password = os.getenv("ADMIN_PASSWORD", "admin")      # Default admin password
    
    # Create an admin account regardless of environment variables
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Check if admin exists
    with Session(engine) as db:
        admin = db.exec(select(models.User).where(models.User.email == admin_email)).first()
        
        if not admin:
            # Create admin user
            admin = models.User(
                email=admin_email,
                name="Admin User",
                hashed_password=pwd_context.hash(admin_password),
                role=models.UserRole.admin,
                is_auth=True  # Auto-authenticate admin
            )
            db.add(admin)
            db.commit()
            print(f"✅ Admin user created: {admin_email} with password: {admin_password}")
        else:
            print(f"✅ Admin user already exists: {admin_email}")
    
    # Create owner user if it doesn't exist and OWNER creds are provided
    owner_email = os.getenv("OWNER_EMAIL")
    owner_password = os.getenv("OWNER_PASSWORD")
    
    if owner_email and owner_password:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Check if owner exists
        with Session(engine) as db:
            owner = db.exec(select(models.User).where(models.User.email == owner_email)).first()
            
            if not owner:
                # Create owner user
                owner = models.User(
                    email=owner_email,
                    name="Owner User",
                    hashed_password=pwd_context.hash(owner_password),
                    role=models.UserRole.owner,
                    is_auth=True  # Auto-authenticate owner
                )
                db.add(owner)
                db.commit()
                print(f"✅ Owner user created: {owner_email}")
    
    # Create initial settings if they don't exist
    with Session(engine) as db_session:
        settings = crud.get_settings(db_session)
        if not settings:
            print("Creating initial settings...")
            settings = crud.create_settings(db_session)
            print("Initial settings created.")
        else:
            print("Settings already exist.")
        
        # Check if "Henüz Bir Dergiye Atanmamıştır" journal exists
        unassigned_journal = db_session.exec(
            select(models.Journal).where(models.Journal.title == "Henüz Bir Dergiye Atanmamıştır")
        ).first()
        
        if not unassigned_journal:
            # Find an admin user for editor_in_chief
            admin_user = db_session.exec(
                select(models.User).where(models.User.role == models.UserRole.admin)
            ).first()
            
            # Create the unassigned journal
            unassigned_journal = models.Journal(
                title="Henüz Bir Dergiye Atanmamıştır",
                created_date=datetime.utcnow(),
                issue="--",
                is_published=False,
                editor_in_chief_id=admin_user.id if admin_user else None
            )
            db_session.add(unassigned_journal)
            db_session.commit()
            db_session.refresh(unassigned_journal)
            print(f"✅ Created journal: 'Henüz Bir Dergiye Atanmamıştır'")
        else:
            print(f"✅ Journal 'Henüz Bir Dergiye Atanmamıştır' already exists")
        
        # Set the unassigned journal as active
        unassigned_journal = db_session.exec(
            select(models.Journal).where(models.Journal.title == "Henüz Bir Dergiye Atanmamıştır")
        ).first()
        
        if unassigned_journal:
            # Update settings to set this journal as active
            about_text = """
            İnsan ve Mekân” dergisine ait bu logo, insanın zaman ve kültür boyunca mekânla kurduğu çok katmanlı ilişkiyi simgesel bir bütünlük içinde yansıtmaktadır. Logo dış hatlarıyla kemer ya da mihrabı andıran bir formda tasarlanmıştır; bu, hem İslam mimarisine özgü geleneksel bir yapı öğesi olarak hem de insanın yönelişini ve kutsala dair mekânsal aidiyetini ifade eden anlamlı bir çerçevedir. Bu yapısal çerçeve, logonun içerdiği simgeleri bir araya getirerek, onları tarihsel ve kültürel bir bağlam içine yerleştirir.
Logonun solunda yer alan kale burcu, geçmişin savunmacı kent yapısını, medeniyetin tarihsel sürekliliğini ve korunaklılığını simgelerken; ortadaki cami formu ve minare, İslam kültürünün mekân anlayışını, maneviyatı ve insanın kutsal ile ilişkisini temsil eder. Sağda bulunan modern gökdelen ise çağdaş kent yaşamını, teknolojiyi ve modern insanın ürettiği yeni yaşam alanlarını ima eder. Bu üç yapı bir araya geldiğinde, insanın tarihsel, kültürel ve manevi yönleriyle farklı dönemlerde inşa ettiği mekânları bütünlüklü bir şekilde simgelemiş olur.
Üst kısımda yer alan “JHS” harfleri ise bu mimari simgelerin üzerinde yer alarak kurumsal bir referans sunar ve tüm anlatının bir kurum çatısı altında toplandığını işaret eder. Geleneksel ve modern öğelerin aynı çerçeve içerisinde yer alması, geçmişle gelecek arasında kurulan sürekliliği ve insanın bu iki kutup arasında sürdürdüğü mekânsal yolculuğu ifade eder. Böylece logo, sadece mimari birer sembolü değil, aynı zamanda insanın mekânla olan anlam dolu ilişkisini, zamana yayılan bir düşünsel derinlikle yansıtan bütünlüklü bir tasarım sunar.
            """
            settings_update = models.SettingsUpdate(active_journal_id=unassigned_journal.id, about=about_text)
            updated_settings = crud.update_settings(db_session, settings_update)
            print(f"✅ Set journal 'Henüz Bir Dergiye Atanmamıştır' as active")
    
    yield
    
    # Code to run on shutdown (if any)
    print("Shutting down...")

app = FastAPI(lifespan=lifecycle)

# Create uploads directory if it doesn't exist
upload_dir = Path(UPLOAD_DIR)
if not upload_dir.exists():
    upload_dir.mkdir(parents=True)

# Mount static file server for uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

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
app.include_router(public.router) # Include public router

@app.get("/")
def read_root():
    return {"message": "Journal API is running!"}

# Later we will include routers here
# from .routers import entries, auth
# app.include_router(entries.router)
# app.include_router(auth.router) 