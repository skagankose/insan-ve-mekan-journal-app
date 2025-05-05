from sqlmodel import Session, select
from datetime import datetime

from . import models
from . import schemas

# --- Journal Entry CRUD --- #

def get_entry(db: Session, entry_id: int) -> models.JournalEntry | None:
    """Get a single journal entry by its ID."""
    # Using Session.get() is efficient for primary key lookups
    return db.get(models.JournalEntry, entry_id)

def get_entries_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list[models.JournalEntry]:
    """Get all journal entries for a specific user."""
    statement = select(models.JournalEntry).where(models.JournalEntry.owner_id == user_id).offset(skip).limit(limit)
    results = db.exec(statement)
    return results.all()

def create_entry(db: Session, entry: schemas.JournalEntryCreate, user_id: int) -> models.JournalEntry:
    """Create a new journal entry for a specific user."""
    # Create a JournalEntry instance from the schema, adding the owner_id
    db_entry = models.JournalEntry.model_validate(entry) # Use model_validate for Pydantic v2+
    db_entry.owner_id = user_id
    # created_at and updated_at are set by default in the model

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def update_entry(db: Session, entry_id: int, entry_update: schemas.JournalEntryUpdate) -> models.JournalEntry | None:
    """Update an existing journal entry."""
    db_entry = get_entry(db, entry_id)
    if not db_entry:
        return None

    # Get the update data, excluding unset fields to avoid overwriting with None
    update_data = entry_update.model_dump(exclude_unset=True)

    # Update fields
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    # Update the updated_at timestamp
    db_entry.updated_at = datetime.utcnow()

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def delete_entry(db: Session, entry_id: int) -> models.JournalEntry | None:
    """Delete a journal entry."""
    db_entry = get_entry(db, entry_id)
    if not db_entry:
        return None

    db.delete(db_entry)
    db.commit()
    # After deletion, the object is expired, so we return the original (now detached) object
    # Or you could return True/False or the id
    return db_entry

# --- User CRUD (Placeholder - will be expanded in Phase 3) --- #

def get_user(db: Session, user_id: int):
    return db.get(models.User, user_id)

def get_user_by_username(db: Session, username: str):
    statement = select(models.User).where(models.User.username == username)
    return db.exec(statement).first()

def get_user_by_email(db: Session, email: str):
    statement = select(models.User).where(models.User.email == email)
    return db.exec(statement).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user, hashing the password before saving."""
    from .security import get_password_hash # Import here to avoid circular imports

    hashed_password = get_password_hash(user.password)
    # Create a dictionary for the User model, excluding the plain password
    user_data = user.model_dump(exclude={"password"})
    db_user = models.User(**user_data, hashed_password=hashed_password)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# We'll add create_user and password hashing later 