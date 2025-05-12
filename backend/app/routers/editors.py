from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from .. import models, auth, crud
from ..database import get_session

# Create a dependency for editor authentication
def get_current_editor_user(
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """
    Validate that the current user has editor or admin role.
    """
    if current_user.role not in [models.UserRole.editor, models.UserRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Editor role required."
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
    Get users who are related to journals the editor manages.
    This includes authors and referees of entries in those journals,
    and other editors of those journals.
    """
    # If admin, get all users
    if current_user.role == models.UserRole.admin:
        statement = select(models.User).offset(skip).limit(limit)
        users = db.exec(statement).all()
        return users
    
    # For editors, first get journals they're assigned to
    editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
    journal_ids = [j.id for j in editor_journals]
    
    if not journal_ids:
        # Return at least the current user
        statement = select(models.User).where(models.User.id == current_user.id)
        users = db.exec(statement).all()
        return users
    
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
    
    # Get unique user IDs from various sources
    user_ids = set()
    
    # Add the current user
    user_ids.add(current_user.id)
    
    # Add other editors of the same journals
    if journal_ids:
        editors_statement = select(models.JournalEditorLink.user_id).where(
            models.JournalEditorLink.journal_id.in_(journal_ids)
        )
        editors = db.exec(editors_statement).all()
        for editor in editors:
            if hasattr(editor, 'user_id'):
                user_ids.add(editor.user_id)
            else:
                user_ids.add(editor)
    
    # Add authors and referees of entries
    if entry_ids:
        # Add authors
        authors_statement = select(models.JournalEntryAuthorLink.user_id).where(
            models.JournalEntryAuthorLink.journal_entry_id.in_(entry_ids)
        )
        authors = db.exec(authors_statement).all()
        for author in authors:
            if hasattr(author, 'user_id'):
                user_ids.add(author.user_id)
            else:
                user_ids.add(author)
        
        # Add referees
        referees_statement = select(models.JournalEntryRefereeLink.user_id).where(
            models.JournalEntryRefereeLink.journal_entry_id.in_(entry_ids)
        )
        referees = db.exec(referees_statement).all()
        for referee in referees:
            if hasattr(referee, 'user_id'):
                user_ids.add(referee.user_id)
            else:
                user_ids.add(referee)
    
    # Get the users
    if user_ids:
        statement = select(models.User).where(
            models.User.id.in_(list(user_ids))
        ).offset(skip).limit(limit)
        users = db.exec(statement).all()
        return users
    else:
        # Return at least the current user if no other users found
        statement = select(models.User).where(models.User.id == current_user.id)
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
    # If admin, get all journals
    if current_user.role == models.UserRole.admin:
        statement = select(models.Journal).offset(skip).limit(limit)
        journals = db.exec(statement).all()
        return journals
    
    # For editors, get only journals they are assigned to
    return crud.get_journals_by_editor(db, user_id=current_user.id, skip=skip, limit=limit)

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
    # If admin, get all entries
    if current_user.role == models.UserRole.admin:
        statement = select(models.JournalEntry).offset(skip).limit(limit)
        entries = db.exec(statement).all()
        return entries
    
    # For editors, get entries from journals they're assigned to
    # First get the journals
    editor_journals = crud.get_journals_by_editor(db, user_id=current_user.id)
    journal_ids = [j.id for j in editor_journals]
    
    if not journal_ids:
        return []
    
    # Then get entries from those journals
    statement = select(models.JournalEntry).where(
        models.JournalEntry.journal_id.in_(journal_ids)
    ).offset(skip).limit(limit)
    
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
    # If admin, get all author updates
    if current_user.role == models.UserRole.admin:
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
    # If admin, get all referee updates
    if current_user.role == models.UserRole.admin:
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
    # If admin, get all links
    if current_user.role == models.UserRole.admin:
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
    # If admin, get all links
    if current_user.role == models.UserRole.admin:
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
    # If admin, get all links
    if current_user.role == models.UserRole.admin:
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