from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from .. import models, auth, crud
from ..database import get_session
from ..schemas import EntryUserAdd

# Create a dependency for editor authentication
def get_current_editor_user(
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """
    Validate that the current user has editor or admin role.
    """
    if current_user.role not in [models.UserRole.editor, models.UserRole.admin, models.UserRole.owner]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor, admin, or owner role required."
        )
    return current_user

router = APIRouter(
    prefix="/editors",
    tags=["editors"],
    dependencies=[Depends(get_current_editor_user)],
    responses={404: {"description": "Not found"}}
)

@router.get("/users", response_model=List[models.User])
def get_editor_users(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all users for editors to manage authors and referees.
    Editors need access to all users to be able to assign them as authors/referees.
    """
    # Editors need access to all users to properly manage authors and referees
    # Return all users regardless of role (admin, owner, editor, author, referee)
    statement = select(models.User).offset(skip).limit(limit)
    users = db.exec(statement).all()
    return users

@router.get("/journals", response_model=List[models.Journal])
def get_editor_journals(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all journals that the current editor is assigned to.
    """
    # Filter journals based on user role
    if current_user.role in [models.UserRole.admin, models.UserRole.owner]:
        # Admin/owner can see all journals
        statement = select(models.Journal).order_by(models.Journal.created_date.desc())
    else:
        # Editor can only see journals where they are editor or editor-in-chief
        statement = select(models.Journal).where(
            # Either the user is the editor in chief
            ((models.Journal.editor_in_chief_id == current_user.id) |
             # Or the user is among the journal's editors
             (models.Journal.id.in_(
                 select(models.JournalEditorLink.journal_id).where(
                     models.JournalEditorLink.user_id == current_user.id
                 )
             )))
        ).order_by(models.Journal.created_date.desc())
    
    journals = db.exec(statement).all()
    return journals

@router.get("/journal_entries", response_model=List[models.JournalEntry])
def get_editor_journal_entries(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all journal entries from journals that the current editor is assigned to.
    """
    # Filter entries based on user role
    if current_user.role in [models.UserRole.admin, models.UserRole.owner]:
        # Admin/owner can see all entries
        statement = select(models.JournalEntry).order_by(models.JournalEntry.created_date.desc())
    else:
        # Get journals where the user is editor or editor-in-chief
        user_journals = select(models.Journal.id).where(
            (models.Journal.editor_in_chief_id == current_user.id) |
            (models.Journal.id.in_(
                select(models.JournalEditorLink.journal_id).where(
                    models.JournalEditorLink.user_id == current_user.id
                )
            ))
        )
        
        # Get entries for those journals
        statement = select(models.JournalEntry).where(
            models.JournalEntry.journal_id.in_(user_journals)
        ).order_by(models.JournalEntry.created_date.desc())
    
    entries = db.exec(statement).all()
    return entries

@router.get("/author_updates", response_model=List[models.AuthorUpdate])
def get_editor_author_updates(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all author updates for entries in journals that the current editor is assigned to.
    """
    # If admin or owner, get all author updates
    if current_user.role in [models.UserRole.admin, models.UserRole.owner]:
        statement = select(models.AuthorUpdate).offset(skip).limit(limit)
        updates = db.exec(statement).all()
        return updates
    
    # For editors, first get entries from their journals
    editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
    journal_ids = [j.id for j in editor_journals]
    
    if not journal_ids:
        return []
    
    # Get entries from those journals
    entry_statement = select(models.JournalEntry.id).where(
        models.JournalEntry.journal_id.in_(journal_ids)
    )
    entries = db.exec(entry_statement).all()
    
    # The entries returned are already integers or row objects with an id attribute
    # Let's handle both cases
    if entries and hasattr(entries[0], 'id'):
        entry_ids = [e.id for e in entries]
    else:
        # The entries are already ids (integers)
        entry_ids = entries
    
    if not entry_ids:
        return []
    
    # Then get author updates for those entries
    statement = select(models.AuthorUpdate).where(
        models.AuthorUpdate.entry_id.in_(entry_ids)
    ).offset(skip).limit(limit)
    
    updates = db.exec(statement).all()
    return updates

@router.get("/referee_updates", response_model=List[models.RefereeUpdate])
def get_editor_referee_updates(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all referee updates for entries in journals that the current editor is assigned to.
    """
    # If admin or owner, get all referee updates
    if current_user.role in [models.UserRole.admin, models.UserRole.owner]:
        statement = select(models.RefereeUpdate).offset(skip).limit(limit)
        updates = db.exec(statement).all()
        return updates
    
    # For editors, first get entries from their journals
    editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
    journal_ids = [j.id for j in editor_journals]
    
    if not journal_ids:
        return []
    
    # Get entries from those journals
    entry_statement = select(models.JournalEntry.id).where(
        models.JournalEntry.journal_id.in_(journal_ids)
    )
    entries = db.exec(entry_statement).all()
    
    # The entries returned are already integers or row objects with an id attribute
    # Let's handle both cases
    if entries and hasattr(entries[0], 'id'):
        entry_ids = [e.id for e in entries]
    else:
        # The entries are already ids (integers)
        entry_ids = entries
    
    if not entry_ids:
        return []
    
    # Then get referee updates for those entries
    statement = select(models.RefereeUpdate).where(
        models.RefereeUpdate.entry_id.in_(entry_ids)
    ).offset(skip).limit(limit)
    
    updates = db.exec(statement).all()
    return updates

@router.get("/journal_editor_links", response_model=List[models.JournalEditorLink])
def get_editor_journal_editor_links(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get journal-editor links for journals the editor manages.
    """
    # If admin or owner, get all links
    if current_user.role in [models.UserRole.admin, models.UserRole.owner]:
        statement = select(models.JournalEditorLink).offset(skip).limit(limit)
        links = db.exec(statement).all()
        return links
    
    # For editors, first get journals they're assigned to
    editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
    journal_ids = [j.id for j in editor_journals]
    
    if not journal_ids:
        return []
    
    # Get links only for those journals
    statement = select(models.JournalEditorLink).where(
        models.JournalEditorLink.journal_id.in_(journal_ids)
    ).offset(skip).limit(limit)
    
    links = db.exec(statement).all()
    return links

@router.get("/journal_entry_author_links", response_model=List[models.JournalEntryAuthorLink])
def get_editor_journal_entry_author_links(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get author links for entries in journals the editor manages.
    """
    # If admin or owner, get all links
    if current_user.role in [models.UserRole.admin, models.UserRole.owner]:
        statement = select(models.JournalEntryAuthorLink).offset(skip).limit(limit)
        links = db.exec(statement).all()
        return links
    
    # For editors, first get journals they're assigned to
    editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
    journal_ids = [j.id for j in editor_journals]
    
    if not journal_ids:
        return []
    
    # Get entries for those journals
    entries_statement = select(models.JournalEntry.id).where(
        models.JournalEntry.journal_id.in_(journal_ids)
    )
    entries = db.exec(entries_statement).all()
    
    # The entries returned could be integers or row objects with an id attribute
    if entries and hasattr(entries[0], 'id'):
        entry_ids = [e.id for e in entries]
    else:
        # The entries are already ids (integers)
        entry_ids = entries
    
    if not entry_ids:
        return []
    
    # Get links only for those entries
    statement = select(models.JournalEntryAuthorLink).where(
        models.JournalEntryAuthorLink.journal_entry_id.in_(entry_ids)
    ).offset(skip).limit(limit)
    
    links = db.exec(statement).all()
    return links

@router.get("/journal_entry_referee_links", response_model=List[models.JournalEntryRefereeLink])
def get_editor_journal_entry_referee_links(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get referee links for entries in journals the editor manages.
    """
    # If admin or owner, get all links
    if current_user.role in [models.UserRole.admin, models.UserRole.owner]:
        statement = select(models.JournalEntryRefereeLink).offset(skip).limit(limit)
        links = db.exec(statement).all()
        return links
    
    # For editors, first get journals they're assigned to
    editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
    journal_ids = [j.id for j in editor_journals]
    
    if not journal_ids:
        return []
    
    # Get entries for those journals
    entries_statement = select(models.JournalEntry.id).where(
        models.JournalEntry.journal_id.in_(journal_ids)
    )
    entries = db.exec(entries_statement).all()
    
    # The entries returned could be integers or row objects with an id attribute
    if entries and hasattr(entries[0], 'id'):
        entry_ids = [e.id for e in entries]
    else:
        # The entries are already ids (integers)
        entry_ids = entries
    
    if not entry_ids:
        return []
    
    # Get links only for those entries
    statement = select(models.JournalEntryRefereeLink).where(
        models.JournalEntryRefereeLink.journal_entry_id.in_(entry_ids)
    ).offset(skip).limit(limit)
    
    links = db.exec(statement).all()
    return links

@router.post("/entries/{entry_id}/authors", response_model=models.JournalEntryAuthorLink)
def add_entry_author_as_editor(
    entry_id: int,
    data: EntryUserAdd,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
):
    """
    Add an author to a journal entry. Only accessible to editors of the journal containing the entry.
    """
    # Get the entry
    entry = db.get(models.JournalEntry, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal entry with ID {entry_id} not found"
        )
    
    # Check if the editor has access to the journal
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner]:
        # Check if the entry belongs to a journal that the editor manages
        if not entry.journal_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry is not associated with any journal"
            )
        
        # Get journals the editor manages
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        
        if entry.journal_id not in journal_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage this entry"
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

@router.delete("/entries/{entry_id}/authors/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_entry_author_as_editor(
    entry_id: int,
    author_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
):
    """
    Remove an author from a journal entry. Only accessible to editors of the journal containing the entry.
    """
    # Get the entry
    entry = db.get(models.JournalEntry, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal entry with ID {entry_id} not found"
        )
    
    # Check if the editor has access to the journal
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner]:
        # Check if the entry belongs to a journal that the editor manages
        if not entry.journal_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry is not associated with any journal"
            )
        
        # Get journals the editor manages
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        
        if entry.journal_id not in journal_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage this entry"
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

@router.post("/entries/{entry_id}/referees", response_model=models.JournalEntryRefereeLink)
def add_entry_referee_as_editor(
    entry_id: int,
    data: EntryUserAdd,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
):
    """
    Add a referee to a journal entry. Only accessible to editors of the journal containing the entry.
    """
    # Get the entry
    entry = db.get(models.JournalEntry, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal entry with ID {entry_id} not found"
        )
    
    # Check if the editor has access to the journal
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner]:
        # Check if the entry belongs to a journal that the editor manages
        if not entry.journal_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry is not associated with any journal"
            )
        
        # Get journals the editor manages
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        
        if entry.journal_id not in journal_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage this entry"
            )
    
    # Check if the user exists and has appropriate role (admin, owner, editor, referee, or author)
    referee = db.get(models.User, data.user_id)
    if not referee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {data.user_id} not found"
        )
    
    if referee.role not in [models.UserRole.admin, models.UserRole.owner, models.UserRole.editor, models.UserRole.referee, models.UserRole.author]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have admin, owner, editor, referee, or author role to be added as a referee"
        )
    
    # Check if the link already exists
    statement = select(models.JournalEntryRefereeLink).where(
        models.JournalEntryRefereeLink.journal_entry_id == entry_id,
        models.JournalEntryRefereeLink.user_id == data.user_id
    )
    existing_link = db.exec(statement).first()
    
    if existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with ID {data.user_id} is already a referee for this entry"
        )
    
    # Create the link
    link = models.JournalEntryRefereeLink(journal_entry_id=entry_id, user_id=data.user_id)
    db.add(link)
    db.commit()
    
    # Send email notifications to all authors
    try:
        from ..email_utils import send_referee_assignment_notification, send_referee_assignment_to_referee_notification
        import os
        
        # Get the Brevo API key
        api_key = os.getenv("BREVO_API_KEY")
        if api_key:
            # Get all authors for this entry
            authors_statement = select(models.JournalEntryAuthorLink).where(
                models.JournalEntryAuthorLink.journal_entry_id == entry_id
            )
            author_links = db.exec(authors_statement).all()
            
            # Collect author names for the referee notification
            author_names = []
            
            for author_link in author_links:
                author = db.get(models.User, author_link.user_id)
                if author:
                    author_names.append(author.name)
                    if author.email:
                        try:
                            send_referee_assignment_notification(
                                api_key=api_key,
                                user_email=author.email,
                                user_name=author.name,
                                referee_name=referee.name,
                                entry_title=entry.title,
                                entry_id=entry_id
                            )
                        except Exception as email_error:
                            print(f"Failed to send referee assignment notification to {author.email}: {email_error}")
                            # Continue processing even if email fails
            
            # Send email notification to the referee themselves
            try:
                send_referee_assignment_to_referee_notification(
                    api_key=api_key,
                    user_email=referee.email,
                    user_name=referee.name,
                    entry_title=entry.title,
                    entry_id=entry_id,
                    entry_authors=author_names,
                    language="en"  # Default to English, could be enhanced based on user preferences
                )
                print(f"Referee assignment notification sent to referee {referee.email}")
            except Exception as email_error:
                print(f"Failed to send referee assignment notification to referee {referee.email}: {email_error}")
                # Continue processing even if email fails
                        
    except Exception as e:
        print(f"Error sending referee assignment notifications: {e}")
        # Don't fail the whole operation if email fails
    
    return link

@router.delete("/entries/{entry_id}/referees/{referee_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_entry_referee_as_editor(
    entry_id: int,
    referee_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_editor_user),
):
    """
    Remove a referee from a journal entry. Only accessible to editors of the journal containing the entry.
    """
    # Get the entry
    entry = db.get(models.JournalEntry, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal entry with ID {entry_id} not found"
        )
    
    # Check if the editor has access to the journal
    if current_user.role not in [models.UserRole.admin, models.UserRole.owner]:
        # Check if the entry belongs to a journal that the editor manages
        if not entry.journal_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry is not associated with any journal"
            )
        
        # Get journals the editor manages
        editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
        journal_ids = [j.id for j in editor_journals]
        
        if entry.journal_id not in journal_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage this entry"
            )
    
    # Check if the link exists
    statement = select(models.JournalEntryRefereeLink).where(
        models.JournalEntryRefereeLink.journal_entry_id == entry_id,
        models.JournalEntryRefereeLink.user_id == referee_id
    )
    link = db.exec(statement).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Referee with ID {referee_id} is not a referee for entry with ID {entry_id}"
        )
    
    # Delete the link
    db.delete(link)
    db.commit()
    
    return None 