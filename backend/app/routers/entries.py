from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from .. import crud, models, schemas, auth
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
    if db_entry.owner_id != current_user.id:
        # Although the get_entries_by_user filters, this adds direct access protection
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this entry")
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
    if db_entry.owner_id != current_user.id:
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
    if db_entry.owner_id != current_user.id:
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
    return entries 