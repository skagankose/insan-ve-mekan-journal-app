from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from .. import models, auth, crud
from ..database import get_session
from ..file_utils import save_upload_file, validate_image, validate_docx, validate_pdf, delete_upload_file

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
    # Check user permissions - only admins or owners can create journals
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin or owner role required."
        )
    
    # Create new journal from the provided data
    db_journal = models.Journal.model_validate(journal)
    
    # Add to database
    db.add(db_journal)
    db.commit()
    db.refresh(db_journal)
    
    return db_journal

@router.post("/{journal_id}/upload", response_model=models.Journal)
async def upload_journal_files(
    journal_id: int,
    cover_photo: Optional[UploadFile] = File(None),
    meta_files: Optional[UploadFile] = File(None),
    editor_notes: Optional[UploadFile] = File(None),
    full_pdf: Optional[UploadFile] = File(None),
    index_section: Optional[UploadFile] = File(None),
    file_path: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Upload files for a journal. Only admin/owner can upload files.
    - cover_photo: Must be .png, .jpg, or .jpeg
    - meta_files: Must be .docx
    - editor_notes: Must be .docx
    - full_pdf: Must be .pdf
    - index_section: Must be .docx
    - file_path: Must be .docx
    """
    # Check user permissions
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin or owner role required."
        )
    
    # Get existing journal
    statement = select(models.Journal).where(models.Journal.id == journal_id)
    db_journal = db.exec(statement).first()
    
    if not db_journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal with ID {journal_id} not found"
        )
    
    # Process each file if provided
    if cover_photo:
        # Delete previous cover photo if exists
        if db_journal.cover_photo:
            delete_upload_file(db_journal.cover_photo)
        
        folder = f"journals/{journal_id}/cover"
        file_path = save_upload_file(cover_photo, folder, validate_image)
        db_journal.cover_photo = file_path
    
    if meta_files:
        # Delete previous meta files if exists
        if db_journal.meta_files:
            delete_upload_file(db_journal.meta_files)
        
        folder = f"journals/{journal_id}/meta"
        file_path = save_upload_file(meta_files, folder, validate_docx)
        db_journal.meta_files = file_path
    
    if editor_notes:
        # Delete previous editor notes if exists
        if db_journal.editor_notes:
            delete_upload_file(db_journal.editor_notes)
        
        folder = f"journals/{journal_id}/notes"
        file_path = save_upload_file(editor_notes, folder, validate_docx)
        db_journal.editor_notes = file_path
    
    if full_pdf:
        # Delete previous full PDF if exists
        if db_journal.full_pdf:
            delete_upload_file(db_journal.full_pdf)
        
        folder = f"journals/{journal_id}/pdf"
        file_path = save_upload_file(full_pdf, folder, validate_pdf)
        db_journal.full_pdf = file_path

    if index_section:
        # Delete previous index section if exists
        if db_journal.index_section:
            delete_upload_file(db_journal.index_section)
        
        folder = f"journals/{journal_id}/index"
        file_path = save_upload_file(index_section, folder, validate_docx)
        db_journal.index_section = file_path

    if file_path:
        # Delete previous file if exists
        if db_journal.file_path:
            delete_upload_file(db_journal.file_path)
        
        folder = f"journals/{journal_id}/file"
        file_path = save_upload_file(file_path, folder, validate_docx)
        db_journal.file_path = file_path
    
    # Save changes
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
    # Check admin or owner role
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin or owner role required to update journals."
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

@router.delete("/{journal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal(
    journal_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Delete a journal and all its related data (entries, updates, files).
    Only admin or owner can delete journals.
    """
    # Check admin or owner role
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin or owner role required to delete journals."
        )
    
    # Delete the journal and all related data
    deleted_journal = crud.delete_journal(db=db, journal_id=journal_id)
    
    if not deleted_journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal with ID {journal_id} not found"
        )
    
    return None 