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
    # if current_user.role not in [models.UserRole.ADMIN, models.UserRole.EDITOR]:
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