from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from .. import models, auth
from ..database import get_session

router = APIRouter(
    prefix="/journals",
    tags=["journals"],
    dependencies=[Depends(auth.get_current_active_user)],
    responses={404: {"description": "Not found"}}
)

@router.post("/", response_model=models.Journal, status_code=status.HTTP_201_CREATED)
def create_journal(
    journal: models.JournalCreate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Create a new journal. Only authenticated users can create journals.
    """
    # Verify user has proper role (optional, uncomment if needed)
    # if current_user.role not in [models.UserRole.admin, models.UserRole.editor]:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Insufficient permissions. Editor or Admin role required to create journals."
    #     )
    
    # Create new journal from the provided data
    db_journal = models.Journal.model_validate(journal)
    
    # Add to database
    db.add(db_journal)
    db.commit()
    db.refresh(db_journal)
    
    return db_journal

@router.get("/", response_model=List[models.Journal])
def get_journals(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all journals. Only authenticated users can view journals.
    """
    statement = select(models.Journal).offset(skip).limit(limit)
    journals = db.exec(statement).all()
    return journals

@router.put("/{journal_id}", response_model=models.Journal)
def update_journal(
    journal_id: int,
    journal_update: models.JournalUpdate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Update a journal by ID. Only authenticated admin users can update journals.
    """
    # Check admin role
    if current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin role required to update journals."
        )
    
    # Get existing journal
    statement = select(models.Journal).where(models.Journal.id == journal_id)
    db_journal = db.exec(statement).first()
    
    if not db_journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal with ID {journal_id} not found"
        )
    
    # Update journal fields with the data that was passed
    journal_data = journal_update.model_dump(exclude_unset=True)
    for key, value in journal_data.items():
        setattr(db_journal, key, value)
    
    # Save changes
    db.add(db_journal)
    db.commit()
    db.refresh(db_journal)
    
    return db_journal 