from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select, or_, and_
from typing import List, Optional

from .. import models, schemas
from ..database import get_session
from ..auth import get_current_user_optional
from ..models import UserRole, JournalEntryStatus

router = APIRouter(
    prefix="/public",
    tags=["public"],
    responses={404: {"description": "Not found"}}
)

@router.get("/entries/{entry_id}", response_model=schemas.JournalEntryRead)
def get_public_entry(
    entry_id: int,
    db: Session = Depends(get_session)
):
    """
    Get a public journal entry by ID.
    Returns entry regardless of journal publication status.
    """
    # Get the entry with its relationships
    statement = select(models.JournalEntry).where(models.JournalEntry.id == entry_id)
    db_entry = db.exec(statement).first()
    
    if not db_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found"
        )
    
    # Increment read count
    db_entry.read_count += 1
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return db_entry

@router.get("/journals", response_model=List[models.Journal])
def get_public_journals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """
    Get all published journals.
    """
    statement = select(models.Journal).where(
        models.Journal.is_published == True
    ).offset(skip).limit(limit)
    
    journals = db.exec(statement).all()
    return journals

@router.get("/journals/{journal_id}", response_model=models.Journal)
def get_journal_by_id(
    journal_id: int,
    db: Session = Depends(get_session)
):
    """
    Get a journal by ID regardless of publication status.
    """
    journal = db.exec(
        select(models.Journal).where(
            models.Journal.id == journal_id
        )
    ).first()
    
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found"
        )
    
    return journal

@router.get("/journals/{journal_id}/entries", response_model=List[schemas.JournalEntryRead])
def get_public_journal_entries(
    journal_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """
    Get all entries for a published journal.
    """
    # First check if the journal exists and is published
    journal = db.exec(
        select(models.Journal).where(
            models.Journal.id == journal_id,
            models.Journal.is_published == True
        )
    ).first()
    
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found"
        )
    
    # Get entries for this journal
    statement = select(models.JournalEntry).where(
        models.JournalEntry.journal_id == journal_id,
        models.JournalEntry.status == JournalEntryStatus.ACCEPTED  # Only return accepted entries
    ).offset(skip).limit(limit)
    
    entries = db.exec(statement).all()
    return entries

@router.get("/journals/{journal_id}/editors", response_model=List[models.JournalEditorLink])
def get_journal_editors(
    journal_id: int,
    db: Session = Depends(get_session)
):
    """
    Get all editors for a journal, regardless of publication status.
    This endpoint is public and doesn't require authentication.
    """
    # First check if the journal exists
    journal = db.exec(
        select(models.Journal).where(
            models.Journal.id == journal_id
        )
    ).first()
    
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found"
        )
    
    # Get editor links for this journal
    statement = select(models.JournalEditorLink).where(
        models.JournalEditorLink.journal_id == journal_id
    )
    
    editor_links = db.exec(statement).all()
    return editor_links

@router.get("/users/{user_id}", response_model=schemas.UserRead)
def get_public_user_info(
    user_id: int,
    db: Session = Depends(get_session)
):
    """
    Get basic information about a user by their ID.
    This endpoint is public and doesn't require authentication.
    """
    # Get the user
    statement = select(models.User).where(models.User.id == user_id)
    user = db.exec(statement).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Return the user's basic information
    return user

@router.get("/search", response_model=schemas.SearchResults)
async def search(
    q: str,
    db: Session = Depends(get_session),
    limit: int = 10,
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Search across users, journals, and journal entries by name, title, or token.
    Case-insensitive search using SQL ILIKE.
    Results are filtered based on authentication status and user role.
    """
    # Prepare empty results
    results = schemas.SearchResults(
        users=[],
        journals=[],
        entries=[]
    )
    
    # Use % for wildcard matching and ilike for case-insensitive search
    search_pattern = f"%{q}%"
    
    # Determine if user has limited access (not logged in or author/referee)
    has_limited_access = (
        current_user is None or 
        (current_user.role != UserRole.admin and 
         current_user.role != UserRole.editor and 
         current_user.role != UserRole.owner)
    )
    
    # Search users by name (case-insensitive)
    if len(q) >= 3:  # Only search if query is at least 3 characters
        # Only search for users if the current user is an admin or owner
        if current_user and (current_user.role == UserRole.admin or current_user.role == UserRole.owner):
            users_statement = select(models.User).where(
                models.User.name.ilike(search_pattern)
            ).limit(limit)
            users = db.exec(users_statement).all()
            results.users = users
    
    # Search journals by title or title_en (case-insensitive)
    if has_limited_access:
        # For limited access, only show published journals
        journals_statement = select(models.Journal).where(
            and_(
                or_(
                    models.Journal.title.ilike(search_pattern),
                    models.Journal.title_en.ilike(search_pattern)
                ),
                models.Journal.is_published == True
            )
        ).limit(limit)
    else:
        # For admin/editor/owner, show all journals
        journals_statement = select(models.Journal).where(
            or_(
                models.Journal.title.ilike(search_pattern),
                models.Journal.title_en.ilike(search_pattern)
            )
        ).limit(limit)
    
    journals = db.exec(journals_statement).all()
    results.journals = journals
    
    # Search entries by title, title_en, or random_token (case-insensitive)
    if has_limited_access:
        # For limited access, only show accepted entries that are in published journals
        entries_statement = select(models.JournalEntry).join(
            models.Journal, models.JournalEntry.journal_id == models.Journal.id
        ).where(
            and_(
                or_(
                    models.JournalEntry.title.ilike(search_pattern),
                    models.JournalEntry.title_en.ilike(search_pattern),
                    models.JournalEntry.random_token.ilike(search_pattern)
                ),
                models.JournalEntry.status == JournalEntryStatus.ACCEPTED,
                models.Journal.is_published == True
            )
        ).limit(limit)
    else:
        # For admin/editor/owner, show all entries
        entries_statement = select(models.JournalEntry).where(
            or_(
                models.JournalEntry.title.ilike(search_pattern),
                models.JournalEntry.title_en.ilike(search_pattern),
                models.JournalEntry.random_token.ilike(search_pattern)
            )
        ).limit(limit)
    
    entries = db.exec(entries_statement).all()
    results.entries = entries
    
    return results 