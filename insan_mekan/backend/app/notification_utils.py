from typing import List
import os
from sqlmodel import Session
from . import models, email_utils

# Get the Brevo API key from environment variable
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
# Frontend base URL for building links
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:5173")

def notify_on_author_update(
    db: Session,
    author_id: int,
    entry_id: int,
    author_update_id: int
):
    """
    Notify all referees and editors about an author update.
    
    Args:
        db: Database session
        author_id: ID of the author who created the update
        entry_id: ID of the journal entry that was updated
        author_update_id: ID of the author update that was created
    """
    # Get the journal entry
    entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not entry:
        print(f"Entry with ID {entry_id} not found")
        return

    # Get the author
    author = db.query(models.User).filter(models.User.id == author_id).first()
    if not author:
        print(f"Author with ID {author_id} not found")
        return
    
    # If the entry has a journal, get the editor in chief
    editor_in_chief = None
    if entry.journal_id:
        journal = db.query(models.Journal).filter(models.Journal.id == entry.journal_id).first()
        if journal and journal.editor_in_chief_id:
            editor_in_chief = db.query(models.User).filter(models.User.id == journal.editor_in_chief_id).first()
    
    # Get all referees for this entry
    referees = entry.referees
    
    # Notify all referees
    for referee in referees:
        try:
            email_utils.send_author_update_notification(
                api_key=BREVO_API_KEY,
                user_email=referee.email,
                user_name=referee.name,
                author_name=author.name,
                entry_title=entry.title,
                entry_id=entry_id,
                base_url=FRONTEND_BASE_URL
            )
        except Exception as e:
            print(f"Failed to send notification to referee {referee.id}: {e}")

    # Notify editor in chief
    if editor_in_chief and editor_in_chief.id != author_id:  # Don't notify if author is also editor
        try:
            email_utils.send_author_update_notification(
                api_key=BREVO_API_KEY,
                user_email=editor_in_chief.email,
                user_name=editor_in_chief.name,
                author_name=author.name,
                entry_title=entry.title,
                entry_id=entry_id,
                base_url=FRONTEND_BASE_URL
            )
        except Exception as e:
            print(f"Failed to send notification to editor in chief {editor_in_chief.id}: {e}")
    
    # Get all editors associated with the journal
    if entry.journal_id:
        editors = db.query(models.User).join(
            models.JournalEditorLink,
            models.User.id == models.JournalEditorLink.user_id
        ).filter(
            models.JournalEditorLink.journal_id == entry.journal_id
        ).all()
        
        # Notify editors (excluding editor in chief who was already notified)
        for editor in editors:
            if editor.id != author_id and (not editor_in_chief or editor.id != editor_in_chief.id):
                try:
                    email_utils.send_author_update_notification(
                        api_key=BREVO_API_KEY,
                        user_email=editor.email,
                        user_name=editor.name,
                        author_name=author.name,
                        entry_title=entry.title,
                        entry_id=entry_id,
                        base_url=FRONTEND_BASE_URL
                    )
                except Exception as e:
                    print(f"Failed to send notification to editor {editor.id}: {e}")


def notify_on_referee_update(
    db: Session,
    referee_id: int,
    entry_id: int,
    referee_update_id: int
):
    """
    Notify all authors and editors about a referee update.
    
    Args:
        db: Database session
        referee_id: ID of the referee who created the update
        entry_id: ID of the journal entry that was updated
        referee_update_id: ID of the referee update that was created
    """
    # Get the journal entry
    entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not entry:
        print(f"Entry with ID {entry_id} not found")
        return

    # Get the referee
    referee = db.query(models.User).filter(models.User.id == referee_id).first()
    if not referee:
        print(f"Referee with ID {referee_id} not found")
        return
    
    # If the entry has a journal, get the editor in chief
    editor_in_chief = None
    if entry.journal_id:
        journal = db.query(models.Journal).filter(models.Journal.id == entry.journal_id).first()
        if journal and journal.editor_in_chief_id:
            editor_in_chief = db.query(models.User).filter(models.User.id == journal.editor_in_chief_id).first()
    
    # Get all authors for this entry
    authors = entry.authors
    
    # Notify all authors
    for author in authors:
        try:
            email_utils.send_referee_update_notification(
                api_key=BREVO_API_KEY,
                user_email=author.email,
                user_name=author.name,
                referee_name=referee.name,
                entry_title=entry.title,
                entry_id=entry_id,
                base_url=FRONTEND_BASE_URL
            )
        except Exception as e:
            print(f"Failed to send notification to author {author.id}: {e}")

    # Notify editor in chief
    if editor_in_chief and editor_in_chief.id != referee_id:  # Don't notify if referee is also editor
        try:
            email_utils.send_referee_update_notification(
                api_key=BREVO_API_KEY,
                user_email=editor_in_chief.email,
                user_name=editor_in_chief.name,
                referee_name=referee.name,
                entry_title=entry.title,
                entry_id=entry_id,
                base_url=FRONTEND_BASE_URL
            )
        except Exception as e:
            print(f"Failed to send notification to editor in chief {editor_in_chief.id}: {e}")
    
    # Get all editors associated with the journal
    if entry.journal_id:
        editors = db.query(models.User).join(
            models.JournalEditorLink,
            models.User.id == models.JournalEditorLink.user_id
        ).filter(
            models.JournalEditorLink.journal_id == entry.journal_id
        ).all()
        
        # Notify editors (excluding editor in chief who was already notified)
        for editor in editors:
            if editor.id != referee_id and (not editor_in_chief or editor.id != editor_in_chief.id):
                try:
                    email_utils.send_referee_update_notification(
                        api_key=BREVO_API_KEY,
                        user_email=editor.email,
                        user_name=editor.name,
                        referee_name=referee.name,
                        entry_title=entry.title,
                        entry_id=entry_id,
                        base_url=FRONTEND_BASE_URL
                    )
                except Exception as e:
                    print(f"Failed to send notification to editor {editor.id}: {e}") 