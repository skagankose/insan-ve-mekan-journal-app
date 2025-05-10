from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from .. import models, auth
from ..database import get_session
from .. import crud

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(auth.get_current_active_user)],
)

# Helper function to check admin role
def get_current_admin_user(current_user: models.User = Depends(auth.get_current_active_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin role required.",
        )
    return current_user

@router.get("/users", response_model=List[models.UserRead])
def get_all_users(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all users. Only accessible to admin users.
    """
    statement = select(models.User).offset(skip).limit(limit)
    users = db.exec(statement).all()
    return users

@router.get("/journals", response_model=List[models.Journal])
def get_all_journals(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all journals. Only accessible to admin users.
    """
    statement = select(models.Journal).offset(skip).limit(limit)
    journals = db.exec(statement).all()
    return journals

@router.get("/journal-entries", response_model=List[models.JournalEntry])
def get_all_journal_entries(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all journal entries. Only accessible to admin users.
    """
    statement = select(models.JournalEntry).offset(skip).limit(limit)
    entries = db.exec(statement).all()
    return entries

@router.get("/journal-entry-progress", response_model=List[models.JournalEntryProgress])
def get_all_journal_entry_progress(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all journal entry progress records. Only accessible to admin users.
    """
    statement = select(models.JournalEntryProgress).offset(skip).limit(limit)
    progress_records = db.exec(statement).all()
    return progress_records

@router.put("/settings", response_model=models.SettingsRead)
def update_settings(
    settings: models.SettingsUpdate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
):
    """
    Update application settings. Only accessible to admin users.
    """
    return crud.update_settings(db=db, settings_update=settings) 