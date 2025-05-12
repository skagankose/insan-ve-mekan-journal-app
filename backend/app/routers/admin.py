from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from sqlalchemy import text
import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

from .. import models, auth, schemas
from ..database import get_session
from .. import crud
from ..email_utils import SENDER_EMAIL, SENDER_NAME

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(auth.get_current_active_user)],
)

# Helper function to check admin role
def get_current_admin_user(current_user: models.User = Depends(auth.get_current_active_user)):
    if current_user.role != models.UserRole.admin:
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
    # First get raw users data without ORM to avoid enum validation errors
    try:
        # Use raw SQL to bypass SQLAlchemy's enum validation
        result = db.execute(text(f"SELECT * FROM users LIMIT {limit} OFFSET {skip}"))
        users_data = result.mappings().all()
        
        # Convert to dictionary objects to avoid enum validation issues
        sanitized_users = []
        for user_data in users_data:
            user_dict = dict(user_data)
            
            # Ensure science_branch is valid or set to None
            if user_dict.get('science_branch') and not any(branch.value == user_dict['science_branch'] for branch in models.ScienceBranch):
                user_dict['science_branch'] = None
            
            # Map title enum keys to their display values
            if user_dict.get('title'):
                try:
                    # Try to find the enum by name
                    title_enum = models.UserTitle[user_dict['title']]
                    user_dict['title'] = title_enum.value
                except (KeyError, ValueError):
                    # If not found, set to None
                    user_dict['title'] = None
            
            # Map role enum keys to values if needed
            if user_dict.get('role'):
                try:
                    role_enum = models.UserRole[user_dict['role']]
                    user_dict['role'] = role_enum.value
                except (KeyError, ValueError):
                    # Default to author if invalid
                    user_dict['role'] = "author"
            
            sanitized_users.append(user_dict)
        
        return sanitized_users
    except Exception as e:
        # Fallback to standard ORM method if the raw query fails
        print(f"Error in raw SQL method: {e}")
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
    
    # Generate random tokens for entries that don't have one
    for entry in entries:
        if not entry.random_token:
            entry.generate_random_token()
            db.add(entry)
    
    # Commit all changes at once for efficiency
    if any(not entry.random_token for entry in entries):
        db.commit()
        
    return entries

# @router.get("/journal-entry-progress", response_model=List[models.JournalEntryProgress])
# def get_all_journal_entry_progress(
#     db: Session = Depends(get_session),
#     current_user: models.User = Depends(get_current_admin_user),
#     skip: int = 0,
#     limit: int = 100,
# ):
#     """
#     Get all journal entry progress records. Only accessible to admin users.
#     """
#     statement = select(models.JournalEntryProgress).offset(skip).limit(limit)
#     progress_records = db.exec(statement).all()
#     return progress_records

@router.get("/settings", response_model=models.SettingsRead)
def get_settings(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
):
    """
    Get application settings. Only accessible to admin users.
    """
    return crud.get_settings(db=db)

@router.put("/users/{user_id}", response_model=models.UserRead)
def update_user(
    user_id: int,
    user_update: models.UserUpdate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
):
    """
    Update a user by ID. Only accessible to admin users.
    """
    updated_user = crud.update_user(db=db, user_id=user_id, user_update=user_update)
    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    return updated_user

@router.post("/users/{user_id}/login-token", response_model=dict)
def generate_login_token(
    user_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
):
    """
    Generate a temporary login token for a user. Only accessible by admins.
    """
    from datetime import timedelta
    from .. import security
    
    # Get the user by ID
    statement = select(models.User).where(models.User.id == user_id)
    user = db.exec(statement).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    # Create a special token with long expiration (6 months)
    token_expires = timedelta(days=180)  # 6 months instead of 15 minutes
    token_data = {"sub": user.email, "is_temp_login": True, "user_id": user_id}
    
    # Generate the token
    token = security.create_access_token(data=token_data, expires_delta=token_expires)
    
    return {"token": token}

@router.post("/users/{user_id}/send-login-link", status_code=status.HTTP_200_OK)
def send_login_link_email(
    user_id: int,
    login_data: dict,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
):
    """
    Send a login link to a user via email. Only accessible by admins.
    """
    # Get the user by ID
    statement = select(models.User).where(models.User.id == user_id)
    user = db.exec(statement).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    try:
        login_link = login_data.get("login_link")
        if not login_link:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Login link is required"
            )
            
        # Get custom email address if provided, otherwise use user's email
        email_address = login_data.get("email_address")
        recipient_email = email_address if email_address else user.email
        recipient_name = user.name  # Always use the user's name
        
        # Use the existing email sending function, but customize for login link
        api_key = os.getenv("BREVO_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Email service API key not configured"
            )
        
        # Custom email for login link
        subject = "Your Login Link"
        html_content = f"""
        <html>
            <body>
                <h1>Hi {user.name},</h1>
                <p>You have been provided with a temporary login link:</p>
                <p><a href="{login_link}">Click here to login</a></p>
                <p>This link will expire in 6 months.</p>
                <p>If you did not request this link, please contact the administrator.</p>
                <p>Thanks,</p>
                <p>The Human and Space Team</p>
            </body>
        </html>
        """
        
        # Configure the Brevo client
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = api_key
        
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
        to = [{"email": recipient_email, "name": recipient_name}]
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=to, 
            sender=sender, 
            subject=subject, 
            html_content=html_content
        )
        
        api_response = api_instance.send_transac_email(send_smtp_email)
        return {"success": True, "message": f"Login link sent to {recipient_email}"}
        
    except ApiException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send login link: {e.reason}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send login link: {str(e)}"
        )

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

@router.get("/author-updates", response_model=List[models.AuthorUpdate])
def get_all_author_updates(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all author updates. Only accessible to admin users.
    """
    statement = select(models.AuthorUpdate).offset(skip).limit(limit)
    updates = db.exec(statement).all()
    return updates

@router.get("/referee-updates", response_model=List[models.RefereeUpdate])
def get_all_referee_updates(
    db: Session = Depends(get_session), 
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all referee updates. Only accessible to admin users.
    """
    statement = select(models.RefereeUpdate).offset(skip).limit(limit)
    updates = db.exec(statement).all()
    return updates

@router.get("/journal-editor-links", response_model=List[models.JournalEditorLink])
def get_all_journal_editor_links(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all journal-editor links. Only accessible to admin users.
    """
    statement = select(models.JournalEditorLink).offset(skip).limit(limit)
    links = db.exec(statement).all()
    return links

@router.get("/journal-entry-author-links", response_model=List[models.JournalEntryAuthorLink])
def get_all_journal_entry_author_links(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all journal entry author links. Only accessible to admin users.
    """
    statement = select(models.JournalEntryAuthorLink).offset(skip).limit(limit)
    links = db.exec(statement).all()
    return links

@router.get("/journal-entry-referee-links", response_model=List[models.JournalEntryRefereeLink])
def get_all_journal_entry_referee_links(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all journal entry referee links. Only accessible to admin users.
    """
    statement = select(models.JournalEntryRefereeLink).offset(skip).limit(limit)
    referee_links = db.exec(statement).all()
    return referee_links

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    transfer_data: schemas.UserDelete,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(get_current_admin_user),
):
    """
    Permanently delete a user and transfer their related objects to another user.
    Only accessible to admin users.
    """
    # Get the transfer_to_user_id from the request body
    transfer_to_user_id = transfer_data.transfer_to_user_id
    
    # Check that we're not trying to delete an admin
    user_to_delete = crud.get_user(db, user_id)
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    if user_to_delete.role == models.UserRole.admin and user_to_delete.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete another admin user"
        )
    
    # Call the CRUD function to delete the user and transfer relationships
    result = crud.delete_user(db, user_id, transfer_to_user_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User deletion failed. Check that both users exist."
        )
    
    # Return 204 No Content
    return None 