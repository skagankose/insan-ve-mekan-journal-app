from sqlmodel import Session, select
from datetime import datetime
import secrets
from typing import Optional
import os

from . import models
from . import schemas
from .file_utils import delete_upload_file, delete_upload_directory

# --- Journal Entry CRUD --- #

def get_entry(db: Session, entry_id: int) -> models.JournalEntry | None:
    """Get a single journal entry by its ID."""
    # Using Session.get() is efficient for primary key lookups
    return db.get(models.JournalEntry, entry_id)

def get_entries_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list[models.JournalEntry]:
    """Get all journal entries for a specific user as an author."""
    # Join with the author link table to get entries where the user is an author
    statement = select(models.JournalEntry).join(
        models.JournalEntryAuthorLink, 
        models.JournalEntry.id == models.JournalEntryAuthorLink.journal_entry_id
    ).where(
        models.JournalEntryAuthorLink.user_id == user_id
    ).offset(skip).limit(limit)
    
    results = db.exec(statement)
    return results.all()

def get_entries_by_referee(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list[models.JournalEntry]:
    """Get all journal entries for a specific user as a referee."""
    # Join with the referee link table to get entries where the user is a referee
    statement = select(models.JournalEntry).join(
        models.JournalEntryRefereeLink, 
        models.JournalEntry.id == models.JournalEntryRefereeLink.journal_entry_id
    ).where(
        models.JournalEntryRefereeLink.user_id == user_id
    ).offset(skip).limit(limit)
    
    results = db.exec(statement)
    return results.all()

def get_journals_by_editor(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list[models.Journal]:
    """Get all journals where a specific user is an editor."""
    # Join with the editor link table to get journals where the user is an editor
    statement = select(models.Journal).join(
        models.JournalEditorLink, 
        models.Journal.id == models.JournalEditorLink.journal_id
    ).where(
        models.JournalEditorLink.user_id == user_id
    ).offset(skip).limit(limit)
    
    results = db.exec(statement)
    return results.all()

def create_entry(db: Session, entry: schemas.JournalEntryCreate, user_id: int) -> models.JournalEntry:
    """Create a new journal entry for a specific user."""
    # Create a JournalEntry instance from the schema
    entry_data = entry.model_dump()
    
    # Remove ID if present to ensure auto-increment works
    if 'id' in entry_data:
        del entry_data['id']
    
    # Extract author_ids if present, otherwise use empty list
    author_ids = entry_data.pop('authors_ids', []) if hasattr(entry, 'authors_ids') else []
    
    # Ensure the current user is included in authors
    if user_id not in author_ids:
        author_ids.append(user_id)
    
    # Create entry without authors first
    db_entry = models.JournalEntry(**entry_data)
    db.add(db_entry)
    db.flush()  # Flush to get the entry ID
    
    # Generate random token that includes the entry ID
    db_entry.generate_random_token()
    
    # Add authors to the entry
    for author_id in author_ids:
        author_link = models.JournalEntryAuthorLink(
            journal_entry_id=db_entry.id,
            user_id=author_id
        )
        db.add(author_link)
    
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

    # Extract authors_ids and referees_ids if present
    authors_ids = update_data.pop('authors_ids', None)
    referees_ids = update_data.pop('referees_ids', None)

    # Handle journal_id explicitly to allow setting it to None
    journal_id = update_data.pop('journal_id', None) if 'journal_id' in update_data else None
    if journal_id is not None:  # This will be true even if journal_id is explicitly set to None
        db_entry.journal_id = journal_id

    # Update other fields
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    # Update the updated_at timestamp
    db_entry.updated_at = datetime.utcnow()

    # Update authors if authors_ids was provided
    if authors_ids is not None:
        # Clear existing author links
        statement = select(models.JournalEntryAuthorLink).where(
            models.JournalEntryAuthorLink.journal_entry_id == db_entry.id
        )
        existing_links = db.exec(statement).all()
        for link in existing_links:
            db.delete(link)
        
        # Add new author links
        for author_id in authors_ids:
            author_link = models.JournalEntryAuthorLink(
                journal_entry_id=db_entry.id,
                user_id=author_id
            )
            db.add(author_link)

    # Update referees if referees_ids was provided
    if referees_ids is not None:
        # Clear existing referee links
        statement = select(models.JournalEntryRefereeLink).where(
            models.JournalEntryRefereeLink.journal_entry_id == db_entry.id
        )
        existing_links = db.exec(statement).all()
        for link in existing_links:
            db.delete(link)
        
        # Add new referee links
        for referee_id in referees_ids:
            referee_link = models.JournalEntryRefereeLink(
                journal_entry_id=db_entry.id,
                user_id=referee_id
            )
            db.add(referee_link)

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def delete_entry(db: Session, entry_id: int) -> models.JournalEntry | None:
    """Delete a journal entry."""
    db_entry = get_entry(db, entry_id)
    if not db_entry:
        return None

    # Delete all author updates for this entry
    statement = select(models.AuthorUpdate).where(models.AuthorUpdate.entry_id == entry_id)
    author_updates = db.exec(statement).all()
    for update in author_updates:
        if update.file_path:
            delete_upload_file(update.file_path)
        db.delete(update)

    # Delete all referee updates for this entry
    statement = select(models.RefereeUpdate).where(models.RefereeUpdate.entry_id == entry_id)
    referee_updates = db.exec(statement).all()
    for update in referee_updates:
        if update.file_path:
            delete_upload_file(update.file_path)
        db.delete(update)
    
    # Delete the entry's file if it exists
    if db_entry.file_path:
        delete_upload_file(db_entry.file_path)
    
    # Delete the entry's folder and all its contents
    entry_folder = f"entries/{entry_id}"
    delete_upload_directory(entry_folder)
    
    # Flush to ensure updates are deleted before deleting the entry
    db.flush()

    # Finally delete the entry itself
    db.delete(db_entry)
    db.commit()
    
    # After deletion, the object is expired, so we return the original (now detached) object
    return db_entry

# --- User CRUD (Placeholder - will be expanded in Phase 3) --- #

def get_user(db: Session, user_id: int) -> models.User | None:
    """Get a user by ID."""
    return db.get(models.User, user_id)

def get_user_by_email(db: Session, email: str):
    statement = select(models.User).where(models.User.email == email)
    return db.exec(statement).first()

def get_user_by_token(db: Session, token: str) -> Optional[models.User]:
    """Get a user by confirmation token."""
    statement = select(models.User).where(models.User.confirmation_token == token)
    return db.exec(statement).first()

def get_user_by_reset_token(db: Session, token: str) -> Optional[models.User]:
    """Get a user by password reset token."""
    statement = select(models.User).where(models.User.reset_password_token == token)
    return db.exec(statement).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user, hashing the password before saving."""
    from .security import get_password_hash # Import here to avoid circular imports

    hashed_password = get_password_hash(user.password)
    user_data = user.model_dump(exclude={"password"})
    
    # Generate confirmation token
    confirmation_token = secrets.token_urlsafe(32)
    confirmation_token_created_at = datetime.utcnow()

    db_user = models.User(
        **user_data,
        hashed_password=hashed_password,
        confirmation_token=confirmation_token,
        confirmation_token_created_at=confirmation_token_created_at
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> models.User | None:
    """Update an existing user."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    # Get the update data, excluding unset fields to avoid overwriting with None
    update_data = user_update.model_dump(exclude_unset=True)

    # Update fields
    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int, transfer_to_user_id: int) -> bool:
    """
    Permanently delete a user and transfer all related objects to another user.
    
    Args:
        db: Database session
        user_id: ID of the user to delete
        transfer_to_user_id: ID of the user to transfer relationships to
        
    Returns:
        True if successful, False if either user not found
    """
    # Get both users
    user_to_delete = get_user(db, user_id)
    transfer_to_user = get_user(db, transfer_to_user_id)
    
    if not user_to_delete or not transfer_to_user:
        return False
    
    # Transfer journal editor in chief relationships
    statement = select(models.Journal).where(
        models.Journal.editor_in_chief_id == user_id
    )
    journals_as_chief = db.exec(statement).all()
    
    for journal in journals_as_chief:
        journal.editor_in_chief_id = transfer_to_user_id
        db.add(journal)
    
    # Flush to ensure editor-in-chief changes are committed
    db.flush()
    
    # Transfer JournalEditorLink relationships
    statement = select(models.JournalEditorLink).where(
        models.JournalEditorLink.user_id == user_id
    )
    editor_links = db.exec(statement).all()
    
    for link in editor_links:
        # Check if the transfer user already has this relationship
        existing_link = db.exec(
            select(models.JournalEditorLink).where(
                models.JournalEditorLink.journal_id == link.journal_id,
                models.JournalEditorLink.user_id == transfer_to_user_id
            )
        ).first()
        
        if not existing_link:
            # Create new link with the transfer user
            new_link = models.JournalEditorLink(
                journal_id=link.journal_id,
                user_id=transfer_to_user_id
            )
            db.add(new_link)
        
        # Delete the old link
        db.delete(link)
    
    # Transfer JournalEntryAuthorLink relationships
    statement = select(models.JournalEntryAuthorLink).where(
        models.JournalEntryAuthorLink.user_id == user_id
    )
    author_links = db.exec(statement).all()
    
    for link in author_links:
        # Check if the transfer user already has this relationship
        existing_link = db.exec(
            select(models.JournalEntryAuthorLink).where(
                models.JournalEntryAuthorLink.journal_entry_id == link.journal_entry_id,
                models.JournalEntryAuthorLink.user_id == transfer_to_user_id
            )
        ).first()
        
        if not existing_link:
            # Create new link with the transfer user
            new_link = models.JournalEntryAuthorLink(
                journal_entry_id=link.journal_entry_id,
                user_id=transfer_to_user_id
            )
            db.add(new_link)
        
        # Delete the old link
        db.delete(link)
    
    # Transfer JournalEntryRefereeLink relationships
    statement = select(models.JournalEntryRefereeLink).where(
        models.JournalEntryRefereeLink.user_id == user_id
    )
    referee_links = db.exec(statement).all()
    
    for link in referee_links:
        # Check if the transfer user already has this relationship
        existing_link = db.exec(
            select(models.JournalEntryRefereeLink).where(
                models.JournalEntryRefereeLink.journal_entry_id == link.journal_entry_id,
                models.JournalEntryRefereeLink.user_id == transfer_to_user_id
            )
        ).first()
        
        if not existing_link:
            # Create new link with the transfer user
            new_link = models.JournalEntryRefereeLink(
                journal_entry_id=link.journal_entry_id,
                user_id=transfer_to_user_id
            )
            db.add(new_link)
        
        # Delete the old link
        db.delete(link)
    
    # Transfer AuthorUpdate relationships
    statement = select(models.AuthorUpdate).where(
        models.AuthorUpdate.author_id == user_id
    )
    author_updates = db.exec(statement).all()
    
    for update in author_updates:
        update.author_id = transfer_to_user_id
        db.add(update)
    
    # Transfer RefereeUpdate relationships
    statement = select(models.RefereeUpdate).where(
        models.RefereeUpdate.referee_id == user_id
    )
    referee_updates = db.exec(statement).all()
    
    for update in referee_updates:
        update.referee_id = transfer_to_user_id
        db.add(update)
    
    # Commit all the relationship transfers
    db.flush()
    
    # Finally, delete the user
    db.delete(user_to_delete)
    db.commit()
    
    return True

# We'll add create_user and password hashing later 

# --- Settings CRUD --- #

def get_settings(db: Session) -> models.Settings:
    """Get the application settings. There should only be one row with id=1."""
    return db.get(models.Settings, 1)

def create_settings(db: Session) -> models.Settings:
    """Create the initial settings row if it doesn't exist."""
    settings = models.Settings(id=None)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings

def update_settings(db: Session, settings_update: models.SettingsUpdate) -> models.Settings:
    """Update the application settings."""
    db_settings = get_settings(db)
    if not db_settings:
        db_settings = create_settings(db)
    
    # Get the update data, excluding unset fields
    update_data = settings_update.model_dump(exclude_unset=True)
    
    # Update fields
    for key, value in update_data.items():
        setattr(db_settings, key, value)
    
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings

def create_password_reset_token(db: Session, email: str) -> Optional[models.User]:
    """Create a password reset token for a user and return the user object."""
    # Find the user by email
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    # Generate reset token and set expiry time
    reset_token = secrets.token_urlsafe(32)
    reset_token_created_at = datetime.utcnow()
    
    # Update the user with the new token
    user.reset_password_token = reset_token
    user.reset_password_token_created_at = reset_token_created_at
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def update_user_password(db: Session, user_id: int, new_password: str) -> models.User:
    """Update a user's password and clear the reset token."""
    from .security import get_password_hash  # Import here to avoid circular imports
    
    # Get the user
    statement = select(models.User).where(models.User.id == user_id)
    user = db.exec(statement).first()
    
    if not user:
        raise ValueError(f"User with ID {user_id} not found")
    
    # Hash the new password
    hashed_password = get_password_hash(new_password)
    
    # Update the user
    user.hashed_password = hashed_password
    user.reset_password_token = None
    user.reset_password_token_created_at = None
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def delete_journal(db: Session, journal_id: int) -> models.Journal | None:
    """Delete a journal and all its related data."""
    db_journal = db.get(models.Journal, journal_id)
    if not db_journal:
        return None

    # Get all entries for this journal
    statement = select(models.JournalEntry).where(models.JournalEntry.journal_id == journal_id)
    entries = db.exec(statement).all()
    
    # Delete each entry and its related data
    for entry in entries:
        delete_entry(db, entry.id)
    
    # Delete journal's files if they exist
    if db_journal.cover_photo:
        delete_upload_file(db_journal.cover_photo)
    if db_journal.meta_files:
        delete_upload_file(db_journal.meta_files)
    if db_journal.editor_notes:
        delete_upload_file(db_journal.editor_notes)
    if db_journal.full_pdf:
        delete_upload_file(db_journal.full_pdf)
    
    # Delete the journal's folder and all its contents
    journal_folder = f"journals/{journal_id}"
    delete_upload_directory(journal_folder)
    
    # Delete the journal itself
    db.delete(db_journal)
    db.commit()
    
    return db_journal 