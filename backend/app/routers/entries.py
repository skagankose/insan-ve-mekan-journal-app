from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from .. import crud, models, schemas, auth, notification_utils
from ..database import get_session

router = APIRouter(
    prefix="/entries",
    tags=["entries"],
    dependencies=[Depends(auth.get_current_active_user)],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=schemas.JournalEntryRead, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    entry: schemas.JournalEntryCreate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Create a new journal entry for the current user.
    """
    return crud.create_entry(db=db, entry=entry, user_id=current_user.id)


@router.get("/", response_model=List[schemas.JournalEntryRead])
def read_journal_entries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Retrieve journal entries for the current user.
    """
    entries = crud.get_entries_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    
    # Generate random tokens for entries that don't have one
    for entry in entries:
        if not entry.random_token:
            entry.generate_random_token()
            db.add(entry)
    
    # Commit all changes at once for efficiency
    if any(not entry.random_token for entry in entries):
        db.commit()
    
    return entries


@router.get("/journals", response_model=List[models.Journal])
def get_all_journals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get all journals. Accessible to all users.
    """
    statement = select(models.Journal).offset(skip).limit(limit)
    journals = db.exec(statement).all()
    return journals


@router.get("/{entry_id}", response_model=schemas.JournalEntryRead)
def read_single_journal_entry(
    entry_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Retrieve a specific journal entry by ID.
    Ensures the entry belongs to the current user.
    """
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if current user is an author of this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    
    # Check if current user is a referee of this entry
    is_referee = any(referee.id == current_user.id for referee in db_entry.referees)
    
    # Allow admin, editor, referee, or the entry's author to access
    if current_user.role not in [models.UserRole.admin, models.UserRole.editor] and not is_author and not is_referee:
        # Although the get_entries_by_user filters, this adds direct access protection
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this entry")
    
    # Generate a random token if one doesn't exist
    if not db_entry.random_token:
        db_entry.generate_random_token()
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
    
    # Construct response with authors and referees
    return db_entry


@router.put("/{entry_id}", response_model=schemas.JournalEntryRead)
def update_journal_entry(
    entry_id: int,
    entry: schemas.JournalEntryUpdate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Update a specific journal entry by ID.
    Ensures the entry belongs to the current user before updating.
    """
    db_entry = crud.get_entry(db, entry_id=entry_id) # Check existence first
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if current user is an author of this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    
    # Allow admin, editor, or the entry's author to update
    if current_user.role not in [models.UserRole.admin, models.UserRole.editor] and not is_author:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this entry")
    
    updated_entry = crud.update_entry(db=db, entry_id=entry_id, entry_update=entry)
    # crud.update_entry should technically not return None if the check above passed,
    # but we handle it just in case.
    if updated_entry is None: 
         raise HTTPException(status_code=404, detail="Journal entry not found after attempting update")
    return updated_entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_entry(
    entry_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Delete a specific journal entry by ID.
    Ensures the entry belongs to the current user before deleting.
    """
    db_entry = crud.get_entry(db, entry_id=entry_id) # Check existence and ownership
    if db_entry is None:
        # Return 204 even if not found, as the end state (not present) is achieved.
        # Or you could raise 404.
        # raise HTTPException(status_code=404, detail="Journal entry not found")
        return
    
    # Check if current user is an author of this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    
    # Allow admin, editor, or the entry's author to delete
    if current_user.role not in [models.UserRole.admin, models.UserRole.editor] and not is_author:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this entry")
    
    crud.delete_entry(db=db, entry_id=entry_id)
    # No response body needed for 204
    return


@router.get("/by-journal/{journal_id}", response_model=List[schemas.JournalEntryRead])
def read_journal_entries_by_journal(
    journal_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Retrieve journal entries that belong to a specific journal.
    """
    statement = select(models.JournalEntry).where(
        models.JournalEntry.journal_id == journal_id
    ).offset(skip).limit(limit)
    
    entries = db.exec(statement).all()
    
    # Generate random tokens for entries that don't have one
    for entry in entries:
        if not entry.random_token:
            entry.generate_random_token()
            db.add(entry)
    
    # Commit all changes at once for efficiency
    db.commit()
    
    return entries


@router.get("/{entry_id}/author-updates", response_model=List[models.AuthorUpdate])
def get_entry_author_updates(
    entry_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get all author updates for a specific journal entry.
    """
    # Check if entry exists
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if user has access to this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_referee = any(referee.id == current_user.id for referee in db_entry.referees)
    
    if not (is_author or is_referee or current_user.role in [models.UserRole.admin, models.UserRole.editor]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to access updates for this entry"
        )
    
    # Get author updates for this entry
    statement = select(models.AuthorUpdate).where(
        models.AuthorUpdate.entry_id == entry_id
    ).order_by(models.AuthorUpdate.created_date.desc())
    
    author_updates = db.exec(statement).all()
    return author_updates


@router.post("/{entry_id}/author-updates", response_model=models.AuthorUpdate, status_code=status.HTTP_201_CREATED)
def create_author_update(
    entry_id: int,
    author_update: models.AuthorUpdateCreate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Create a new author update for a specific journal entry.
    """
    # Check if entry exists
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if user is an author of this entry or has admin/editor role
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    
    if not (is_author or current_user.role in [models.UserRole.admin, models.UserRole.editor]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to create author updates for this entry"
        )
    
    # Create new author update with the current user as author
    db_author_update = models.AuthorUpdate(
        **author_update.dict(),
        entry_id=entry_id,
        author_id=current_user.id,
        created_date=datetime.utcnow()
    )
    
    db.add(db_author_update)
    db.commit()
    db.refresh(db_author_update)
    
    # Send email notifications to referees and editors
    try:
        notification_utils.notify_on_author_update(
            db=db,
            author_id=current_user.id,
            entry_id=entry_id,
            author_update_id=db_author_update.id
        )
    except Exception as e:
        # Log the error but don't fail the request if notification fails
        print(f"Failed to send notifications for author update: {e}")
    
    return db_author_update


@router.get("/{entry_id}/referee-updates", response_model=List[models.RefereeUpdate])
def get_entry_referee_updates(
    entry_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get all referee updates for a specific journal entry.
    """
    # Check if entry exists
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if user has access to this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_referee = any(referee.id == current_user.id for referee in db_entry.referees)
    
    if not (is_author or is_referee or current_user.role in [models.UserRole.admin, models.UserRole.editor]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to access updates for this entry"
        )
    
    # Get referee updates for this entry
    statement = select(models.RefereeUpdate).where(
        models.RefereeUpdate.entry_id == entry_id
    ).order_by(models.RefereeUpdate.created_date.desc())
    
    referee_updates = db.exec(statement).all()
    return referee_updates


@router.post("/{entry_id}/referee-updates", response_model=models.RefereeUpdate, status_code=status.HTTP_201_CREATED)
def create_referee_update(
    entry_id: int,
    referee_update: models.RefereeUpdateCreate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Create a new referee update for a specific journal entry.
    """
    # Check if entry exists
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if user is a referee of this entry or has admin/editor role
    is_referee = any(referee.id == current_user.id for referee in db_entry.referees)
    
    if not (is_referee or current_user.role in [models.UserRole.admin, models.UserRole.editor]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to create referee updates for this entry"
        )
    
    # Create new referee update with the current user as referee
    db_referee_update = models.RefereeUpdate(
        **referee_update.dict(),
        entry_id=entry_id,
        referee_id=current_user.id,
        created_date=datetime.utcnow()
    )
    
    db.add(db_referee_update)
    db.commit()
    db.refresh(db_referee_update)
    
    # Send email notifications to authors and editors
    try:
        notification_utils.notify_on_referee_update(
            db=db,
            referee_id=current_user.id,
            entry_id=entry_id,
            referee_update_id=db_referee_update.id
        )
    except Exception as e:
        # Log the error but don't fail the request if notification fails
        print(f"Failed to send notifications for referee update: {e}")
    
    return db_referee_update 