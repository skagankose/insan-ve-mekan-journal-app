from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
import os
import pytz

from .. import crud, models, schemas, auth, notification_utils
from ..database import get_session
from ..file_utils import save_upload_file, delete_upload_file, validate_pdf

router = APIRouter(
    prefix="/entries",
    tags=["entries"],
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
    
    # Check if the user has permissions to access this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_referee = any(referee.id == current_user.id for referee in db_entry.referees)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_author and not is_referee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this entry."
        )
    
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
    
    # Check if the user has permissions to access this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_author:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this entry."
        )
    
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
    
    # Check if the user has permissions to access this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_author:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this entry."
        )
    
    crud.delete_entry(db=db, entry_id=entry_id)
    # No response body needed for 204
    return


@router.post("/{entry_id}/increment-download", status_code=status.HTTP_200_OK)
def increment_download_count(
    entry_id: int,
    db: Session = Depends(get_session)
):
    """
    Increment the download count for a journal entry.
    This endpoint is public and doesn't require authentication.
    """
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Increment the download count
    db_entry.download_count += 1
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return {"message": "Download count incremented successfully"}


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


@router.post("/{entry_id}/authors", response_model=models.JournalEntryAuthorLink)
def add_entry_author(
    entry_id: int,
    data: schemas.EntryUserAdd,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """
    Add an author to a journal entry. 
    Accessible to: admin, owner, journal editors, and entry authors.
    """
    # Get the entry
    entry = db.get(models.JournalEntry, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal entry with ID {entry_id} not found"
        )
    
    # Check permissions
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if current user is an author of the entry
    is_entry_author = any(author.id == current_user.id for author in entry.authors)
    
    # Check if current user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = entry.journal_id in journal_ids
    
    # Check if current user is editor-in-chief of the journal
    is_editor_in_chief = False
    if entry.journal_id:
        journal = db.get(models.Journal, entry.journal_id)
        if journal and journal.editor_in_chief_id == current_user.id:
            is_editor_in_chief = True
    
    if not (is_admin_or_owner or is_entry_author or is_journal_editor or is_editor_in_chief):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to add authors to this entry"
        )
    
    # Check if the user exists
    author = db.get(models.User, data.user_id)
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {data.user_id} not found"
        )
    
    # Check if the link already exists
    statement = select(models.JournalEntryAuthorLink).where(
        models.JournalEntryAuthorLink.journal_entry_id == entry_id,
        models.JournalEntryAuthorLink.user_id == data.user_id
    )
    existing_link = db.exec(statement).first()
    
    if existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with ID {data.user_id} is already an author for this entry"
        )
    
    # Create the link
    link = models.JournalEntryAuthorLink(journal_entry_id=entry_id, user_id=data.user_id)
    db.add(link)
    db.commit()
    
    # Send email notification to the new author
    try:
        import os
        from ..email_utils import send_author_assignment_notification
        
        api_key = os.getenv("BREVO_API_KEY")
        if api_key:
            # Determine language preference (default to English, could be enhanced based on user preferences)
            language = "en"
            
            send_author_assignment_notification(
                api_key=api_key,
                user_email=author.email,
                user_name=author.name,
                entry_title=entry.title,
                entry_id=entry_id,
                language=language
            )
            print(f"Author assignment notification sent to {author.email}")
        else:
            print("Warning: BREVO_API_KEY not found in environment variables. Email notification not sent.")
    except Exception as e:
        # Log the error but don't fail the main operation
        print(f"Failed to send author assignment notification to {author.email}: {e}")
    
    return link


@router.delete("/{entry_id}/authors/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_entry_author(
    entry_id: int,
    author_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """
    Remove an author from a journal entry.
    Accessible to: admin, owner, journal editors, and entry authors.
    """
    # Get the entry
    entry = db.get(models.JournalEntry, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal entry with ID {entry_id} not found"
        )
    
    # Check permissions
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if current user is an author of the entry
    is_entry_author = any(author.id == current_user.id for author in entry.authors)
    
    # Check if current user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = entry.journal_id in journal_ids
    
    # Check if current user is editor-in-chief of the journal
    is_editor_in_chief = False
    if entry.journal_id:
        journal = db.get(models.Journal, entry.journal_id)
        if journal and journal.editor_in_chief_id == current_user.id:
            is_editor_in_chief = True
    
    if not (is_admin_or_owner or is_entry_author or is_journal_editor or is_editor_in_chief):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to remove authors from this entry"
        )
    
    # Check if the link exists
    statement = select(models.JournalEntryAuthorLink).where(
        models.JournalEntryAuthorLink.journal_entry_id == entry_id,
        models.JournalEntryAuthorLink.user_id == author_id
    )
    link = db.exec(statement).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Author with ID {author_id} is not an author for entry with ID {entry_id}"
        )
    
    # Delete the link
    db.delete(link)
    db.commit()
    
    return None


@router.get("/users/search-by-email", response_model=models.User)
def find_user_by_email(
    email: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """
    Find a user by email address. 
    Accessible to: admin, owner, editors, and entry authors.
    This endpoint allows users to search for other users by email when they need to
    add them as authors to entries. The specific permission to add authors to a 
    particular entry is checked in the add author endpoint.
    """
    # Allow admin, owner, editors, and authors to search for users
    # (anyone who might potentially need to add authors to entries)
    allowed_roles = [
        models.UserRole.admin, 
        models.UserRole.owner, 
        models.UserRole.editor,
        models.UserRole.author
    ]
    
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to search for users"
        )
    
    # Find user by email
    user = db.exec(
        select(models.User).where(models.User.email == email.lower().strip())
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found with this email address"
        )
    
    return user

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
    
    # Check if the user has permissions to access this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_referee = any(referee.id == current_user.id for referee in db_entry.referees)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_author and not is_referee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access updates for this entry."
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
    
    # Check if the user has permissions to access this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_author:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create author updates for this entry."
        )
    
    # Create new author update with the current user as author
    db_author_update = models.AuthorUpdate(
        **author_update.dict(),
        entry_id=entry_id,
        author_id=current_user.id,
        created_date=datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None)
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


@router.post("/{entry_id}/author-updates/upload", response_model=models.AuthorUpdate, status_code=status.HTTP_201_CREATED)
async def create_author_update_with_file(
    entry_id: int,
    file: Optional[UploadFile] = File(None, description="Upload a .docx file. It will be automatically converted to PDF."),
    title: Optional[str] = Form(None),
    abstract_en: Optional[str] = Form(None),
    abstract_tr: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    keywords_en: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Create a new author update for a specific journal entry with file upload.
    Only .docx files are accepted and will be automatically converted to PDF.
    """
    # Check if entry exists
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if the user has permissions to access this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False  
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_author:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create author updates for this entry."
        )
    
    # Make sure at least one field is filled or a file is uploaded
    if not title and not abstract_en and not abstract_tr and not keywords and not keywords_en and not notes and not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be filled or a file must be uploaded."
        )
    
    # Create a file path if a file is uploaded
    file_path = None
    pdf_path = None
    if file:
        # Save the file in a folder structure based on entry id
        folder = f"entries/{entry_id}/author_updates"
        file_path = save_upload_file(file, folder)
        
        # Generate PDF path based on the original file path
        if file_path.lower().endswith('.docx'):
            pdf_path = file_path[:-5] + '.pdf'  # Replace .docx with .pdf
    
    # Create author update data with both file paths
    author_update_data = models.AuthorUpdateCreate(
        title=title,
        abstract_en=abstract_en,
        abstract_tr=abstract_tr,
        keywords=keywords,
        keywords_en=keywords_en,
        notes=notes,
        file_path=file_path
    )
    
    # INFO: Disable PDF file notes
    '''
    # Add notes about PDF file if it was created
    notes_with_pdf = notes or ""
    if pdf_path:
        pdf_filename = os.path.basename(pdf_path)
        if notes_with_pdf:
            notes_with_pdf += f"\n\nPDF version available at: {pdf_filename}"
        else:
            notes_with_pdf = f"PDF version available at: {pdf_filename}"
    
    # Update the notes field to include PDF information
    author_update_data.notes = notes_with_pdf
    '''

    # Create new author update with the current user as author
    db_author_update = models.AuthorUpdate(
        **author_update_data.dict(),
        entry_id=entry_id,
        author_id=current_user.id,
        created_date=datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None)
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
    
    # Check if the user has permissions to access this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_referee = any(referee.id == current_user.id for referee in db_entry.referees)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_author and not is_referee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access updates for this entry."
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
    
    # Check if the user has permissions to access this entry
    is_referee = any(referee.id == current_user.id for referee in db_entry.referees)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_referee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create referee updates for this entry."
        )
    
    # Create new referee update with the current user as referee
    db_referee_update = models.RefereeUpdate(
        **referee_update.dict(),
        entry_id=entry_id,
        referee_id=current_user.id,
        created_date=datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None)
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


@router.post("/{entry_id}/referee-updates/upload", response_model=models.RefereeUpdate, status_code=status.HTTP_201_CREATED)
async def create_referee_update_with_file(
    entry_id: int,
    file: Optional[UploadFile] = File(None, description="Upload a .docx file. It will be automatically converted to PDF."),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Create a new referee update for a specific journal entry with file upload.
    Only .docx files are accepted and will be automatically converted to PDF.
    """
    # Check if entry exists
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if the user has permissions to access this entry
    is_referee = any(referee.id == current_user.id for referee in db_entry.referees)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_referee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create referee updates for this entry."
        )
    
    # Make sure at least one field is filled or a file is uploaded
    if not notes and not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be filled or a file must be uploaded."
        )
    
    # Create a file path if a file is uploaded
    file_path = None
    pdf_path = None
    if file:
        # Save the file in a folder structure based on entry id
        folder = f"entries/{entry_id}/referee_updates"
        file_path = save_upload_file(file, folder)
        
        # Generate PDF path based on the original file path
        if file_path.lower().endswith('.docx'):
            pdf_path = file_path[:-5] + '.pdf'  # Replace .docx with .pdf
    
    # Create referee update data with file path
    referee_update_data = models.RefereeUpdateCreate(
        notes=notes,
        file_path=file_path
    )
    
    # Create new referee update with the current user as referee
    db_referee_update = models.RefereeUpdate(
        **referee_update_data.dict(),
        entry_id=entry_id,
        referee_id=current_user.id,
        created_date=datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None)
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


@router.delete("/author-updates/{update_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_author_update(
    update_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Delete an author update by its ID.
    Only the author who created the update, or users with admin/owner roles can delete it.
    """
    # Find the author update
    statement = select(models.AuthorUpdate).where(models.AuthorUpdate.id == update_id)
    db_update = db.exec(statement).first()
    
    if not db_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Author update with ID {update_id} not found"
        )
    
    # Check permission: only the author who created the update or admin/owner can delete
    is_author = db_update.author_id == current_user.id
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    if not is_author and not is_admin_or_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this author update."
        )
    
    # Delete the uploaded file if it exists
    if db_update.file_path:
        delete_upload_file(db_update.file_path)
    
    # Delete the update
    db.delete(db_update)
    db.commit()
    
    return None


@router.delete("/referee-updates/{update_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_referee_update(
    update_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Delete a referee update by its ID.
    Only the referee who created the update, or users with admin/owner roles can delete it.
    """
    # Find the referee update
    statement = select(models.RefereeUpdate).where(models.RefereeUpdate.id == update_id)
    db_update = db.exec(statement).first()
    
    if not db_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Referee update with ID {update_id} not found"
        )
    
    # Check permission: only the referee who created the update or admin/owner can delete
    is_referee = db_update.referee_id == current_user.id
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    if not is_referee and not is_admin_or_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this referee update."
        )
    
    # Delete the uploaded file if it exists
    if db_update.file_path:
        print(f"Attempting to delete file at path: {db_update.file_path}")
        try:
            delete_upload_file(db_update.file_path)
            print("File deletion completed")
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
    else:
        print("No file path found for this update")
    
    # Delete the update
    db.delete(db_update)
    db.commit()
    
    return None


@router.post("/{entry_id}/upload", response_model=models.JournalEntry)
async def upload_entry_file(
    entry_id: int,
    file: UploadFile = File(..., description="Upload a PDF file."),
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Upload a file for a journal entry. Only PDF files are allowed.
    """
    # Check if entry exists
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if the user has permissions to access this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_author:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to upload files for this entry."
        )
    
    # Delete previous file if exists
    if db_entry.file_path:
        delete_upload_file(db_entry.file_path)
    
    # Save the new file
    folder = f"entries/{entry_id}"
    file_path = save_upload_file(file, folder)
    db_entry.file_path = file_path
    
    # Save changes
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return db_entry


@router.post("/{entry_id}/upload-full-pdf", response_model=models.JournalEntry)
async def upload_entry_full_pdf(
    entry_id: int,
    file: UploadFile = File(..., description="Upload a PDF file."),
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Upload a full PDF file for a journal entry. Only PDF files are allowed.
    """
    # Check if entry exists
    db_entry = crud.get_entry(db, entry_id=entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Check if the user has permissions to access this entry
    is_author = any(author.id == current_user.id for author in db_entry.authors)
    is_admin_or_owner = current_user.role in [models.UserRole.admin, models.UserRole.owner]
    
    # Check if user is editor of the journal containing this entry
    is_journal_editor = False
    if current_user.role == models.UserRole.editor and db_entry.journal_id:
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        is_journal_editor = db_entry.journal_id in journal_ids
    
    if not is_admin_or_owner and not is_journal_editor and not is_author:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to upload files for this entry."
        )
    
    # Delete previous file if exists
    if db_entry.full_pdf:
        delete_upload_file(db_entry.full_pdf)
    
    # Save the new file
    folder = f"entries/{entry_id}"
    file_path = save_upload_file(file, folder, validate_pdf)
    db_entry.full_pdf = file_path
    
    # Save changes
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return db_entry 