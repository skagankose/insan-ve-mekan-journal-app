from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
import os

from .. import models, auth, crud
from ..database import get_session
from ..file_utils import save_upload_file, validate_image, validate_docx, validate_pdf, delete_upload_file
from ..docx_utils import merge_docx_files, create_table_of_contents

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
        saved_path = save_upload_file(cover_photo, folder, validate_image)
        db_journal.cover_photo = saved_path
    
    if meta_files:
        # Delete previous meta files if exists
        if db_journal.meta_files:
            delete_upload_file(db_journal.meta_files)
        
        folder = f"journals/{journal_id}/meta"
        saved_path = save_upload_file(meta_files, folder, validate_docx)
        db_journal.meta_files = saved_path
    
    if editor_notes:
        # Delete previous editor notes if exists
        if db_journal.editor_notes:
            delete_upload_file(db_journal.editor_notes)
        
        folder = f"journals/{journal_id}/notes"
        saved_path = save_upload_file(editor_notes, folder, validate_docx)
        db_journal.editor_notes = saved_path
    
    if full_pdf:
        # Delete previous full PDF if exists
        if db_journal.full_pdf:
            delete_upload_file(db_journal.full_pdf)
        
        folder = f"journals/{journal_id}/pdf"
        saved_path = save_upload_file(full_pdf, folder, validate_pdf)
        db_journal.full_pdf = saved_path

    if index_section:
        # Delete previous index section if exists
        if db_journal.index_section:
            delete_upload_file(db_journal.index_section)
        
        folder = f"journals/{journal_id}/index"
        saved_path = save_upload_file(index_section, folder, validate_docx)
        db_journal.index_section = saved_path

    if file_path:
        # Delete previous file if exists
        if db_journal.file_path:
            delete_upload_file(db_journal.file_path)
        
        folder = f"journals/{journal_id}/file"
        saved_path = save_upload_file(file_path, folder, validate_docx)
        db_journal.file_path = saved_path
    
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

@router.post("/{journal_id}/merge", response_model=models.Journal)
async def merge_journal_files(
    journal_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Merge all journal files (meta files, editor notes, INDEX SECTION (ToC), journal entries) 
    into a single .docx file. The table of contents (index section) is generated first.
    Only admin/owner/editor can merge files.
    
    Merge order:
    1. Cover Photo (if available, handled by merge_docx_files function)
    2. Meta files
    3. Index section (Table of Contents - generated in this step)
    4. Editor notes
    5. Journal entries
    """
    # Check user permissions
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner, models.UserRole.editor]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin, owner or editor role required."
        )
    
    # Get existing journal
    statement = select(models.Journal).where(models.Journal.id == journal_id)
    db_journal = db.exec(statement).first()
    
    if not db_journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal with ID {journal_id} not found"
        )

    # --- 1. Create Table of Contents (Index Section) ---
    # Get all completed entries for this journal for ToC
    toc_entries_statement = select(models.JournalEntry).where(
        models.JournalEntry.journal_id == journal_id,
        models.JournalEntry.status == models.JournalEntryStatus.ACCEPTED
    )
    toc_entries = db.exec(toc_entries_statement).all()
    
    if not toc_entries:
        # If no entries, we can still proceed with merging other files, 
        # but the ToC (index_section) will be empty or not created.
        # Let's decide if an empty ToC should be created or if index_section should be None.
        # For now, let's assume if no entries, no ToC is created.
        # We will remove any existing index_section file to avoid including an outdated ToC.
        if db_journal.index_section and os.path.exists(db_journal.index_section):
            delete_upload_file(db_journal.index_section)
        db_journal.index_section = None 
        print(f"No completed entries found for journal {journal_id}. Skipping ToC creation.")
    else:
        # Create output path for table of contents
        toc_output_folder = f"journals/{journal_id}/index"  # Consistent with previous change
        toc_output_filename = f"journal_{journal_id}_toc_generated.docx" # Make filename distinct
        toc_output_path = os.path.join("uploads", toc_output_folder, toc_output_filename)
        
        # Delete previous ToC file if exists, to ensure a fresh one is generated and linked
        if db_journal.index_section and os.path.exists(db_journal.index_section):
            if db_journal.index_section != toc_output_path : # only delete if it's not the target path of a previous run
                delete_upload_file(db_journal.index_section)

        os.makedirs(os.path.join("uploads", toc_output_folder), exist_ok=True) # Ensure directory exists

        entries_data_for_toc = [{
            'title': entry.title,
            'authors': ', '.join([author.name for author in entry.authors]) if entry.authors else '',
            'abstract_tr': entry.abstract_tr,
            'abstract_en': entry.abstract_en,
            'article_type': entry.article_type if entry.article_type else 'N/A',
            'page_number': entry.page_number if entry.page_number else 'N/A'
        } for entry in toc_entries]
        
        toc_success = create_table_of_contents(entries_data_for_toc, toc_output_path)
        
        if not toc_success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create table of contents during merge process."
            )
        
        db_journal.index_section = toc_output_path # Update journal with new ToC path

    # Commit changes related to ToC (new index_section path or None)
    db.add(db_journal)
    db.commit()
    db.refresh(db_journal)
    # --- End of ToC Creation ---

    # --- 2. Collect files for merging ---
    files_to_merge = []
    
    # 2.1. Add meta files if exists
    if db_journal.meta_files and os.path.exists(db_journal.meta_files):
        files_to_merge.append(db_journal.meta_files)
    
    # 2.2. Add THE NEWLY CREATED index section (ToC) if exists
    if db_journal.index_section and os.path.exists(db_journal.index_section):
        files_to_merge.append(db_journal.index_section)
    
    # 2.3. Add editor notes if exists
    if db_journal.editor_notes and os.path.exists(db_journal.editor_notes):
        files_to_merge.append(db_journal.editor_notes)
    
    # 2.4. Add all completed entry files
    # Re-fetch entries if needed, or use toc_entries if they are the same set of entries
    # For simplicity, let's assume toc_entries are the ones whose files should be merged.
    for entry in toc_entries: # Using toc_entries as they are already filtered for ACCEPTED status
        if entry.file_path and os.path.exists(entry.file_path) and entry.file_path.lower().endswith('.docx'):
            files_to_merge.append(entry.file_path)
    
    if not files_to_merge:
        # This check might be redundant if ToC is always created, or if other files are mandatory.
        # If only a ToC was created but no other files, merging is still valid.
        # If no files at all (e.g. no meta, no entries for ToC, no editor notes), then raise error.
        # Let's check if there's anything other than a potential ToC to merge.
        has_other_content_than_toc = any(
            f != db_journal.index_section for f in files_to_merge if db_journal.index_section
        ) or (not db_journal.index_section and files_to_merge)

        if not files_to_merge : # if list is completely empty
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files found to merge (no entries, meta, or notes)."
            )
        elif not has_other_content_than_toc and db_journal.index_section and len(files_to_merge) == 1:
            # Only ToC was generated, nothing else to merge it with.
            # This might be acceptable, or an error, depending on requirements.
            # For now, let's allow merging just a ToC. The merge_docx_files should handle single file.
            print(f"Warning: Only a Table of Contents was found/generated for journal {journal_id}. Merging this single file.")


    # Create output path for the final merged file
    merged_output_folder = f"journals/{journal_id}/merged"
    merged_output_filename = f"journal_{journal_id}_merged_with_toc.docx" # Make filename distinct
    final_output_path = os.path.join("uploads", merged_output_folder, merged_output_filename)
    
    os.makedirs(os.path.join("uploads", merged_output_folder), exist_ok=True) # Ensure directory exists

    # Delete previous final merged file if exists and it's different from the new target
    if db_journal.file_path and os.path.exists(db_journal.file_path):
        if db_journal.file_path != final_output_path:
             delete_upload_file(db_journal.file_path)
    
    # --- 3. Merge the files ---
    # The merge_docx_files function already handles cover_photo_path from db_journal.cover_photo
    merge_success = merge_docx_files(
        file_paths=files_to_merge, 
        output_path=final_output_path,
        cover_photo_path=db_journal.cover_photo if db_journal.cover_photo and os.path.exists(db_journal.cover_photo) else None
    )
    
    if not merge_success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to merge files after ToC creation."
        )
    
    # Update journal with new final merged file path
    db_journal.file_path = final_output_path
    
    # Save changes
    db.add(db_journal)
    db.commit()
    db.refresh(db_journal)
    
    return db_journal

@router.post("/{journal_id}/table-of-contents", response_model=models.Journal)
async def create_journal_toc(
    journal_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Create a table of contents document for a journal's entries.
    Only admin/owner/editor can create table of contents.
    """
    # Check user permissions
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner, models.UserRole.editor]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin, owner or editor role required."
        )
    
    # Get existing journal
    statement = select(models.Journal).where(models.Journal.id == journal_id)
    db_journal = db.exec(statement).first()
    
    if not db_journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal with ID {journal_id} not found"
        )
    
    # Get all completed entries for this journal
    entries_statement = select(models.JournalEntry).where(
        models.JournalEntry.journal_id == journal_id,
        models.JournalEntry.status == models.JournalEntryStatus.ACCEPTED
    )
    entries = db.exec(entries_statement).all()
    
    if not entries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No completed entries found in this journal"
        )
    
    # Create output path for table of contents
    output_folder = f"journals/{journal_id}/index"
    output_filename = f"journal_{journal_id}_toc.docx"
    output_path = os.path.join("uploads", output_folder, output_filename)
    
    # Convert entries to dictionary format
    entries_data = [{
        'title': entry.title,
        'authors': ', '.join([author.name for author in entry.authors]) if entry.authors else '',
        'abstract_tr': entry.abstract_tr,
        'abstract_en': entry.abstract_en
    } for entry in entries]
    
    # Create the table of contents
    success = create_table_of_contents(entries_data, output_path)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create table of contents"
        )
    
    # Update journal with table of contents path
    db_journal.index_section = output_path
    
    # Save changes
    db.add(db_journal)
    db.commit()
    db.refresh(db_journal)
    
    return db_journal 