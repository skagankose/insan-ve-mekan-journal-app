from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlmodel import Session
from datetime import timedelta, datetime
from sqlalchemy import select
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
import os

from .. import crud, schemas, models, auth, security
from ..database import get_session
from ..email_utils import send_confirmation_email, send_password_reset_email

# Your Brevo API Key - consider moving to environment variables for production
# BREVO_API_KEY = "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"
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

router = APIRouter()

@router.post("/users/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED, tags=["auth"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_session)):
    print(f"Received user data for registration: {user.model_dump_json(indent=2)}")
    """
    Register a new user and send a confirmation email.
    """
    db_user_by_email = crud.get_user_by_email(db, email=user.email)
    if db_user_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    created_user = crud.create_user(db=db, user=user)

    # Send confirmation email
    try:
        # Point to your backend server - update this to your actual public URL in production
        base_url_for_email = "http://localhost:8000"  # Use your backend URL, not frontend
        send_confirmation_email(
            api_key=BREVO_API_KEY,
            user_email=created_user.email,
            user_name=created_user.name,
            confirmation_token=created_user.confirmation_token,
            base_url=base_url_for_email
        )
    except HTTPException as e:
        # If email sending fails, we might want to decide if the user creation should be rolled back
        # For now, we'll let the user be created but raise an alert about the email failure.
        # The user can perhaps request a new confirmation email later.
        print(f"User with email {created_user.email} created, but failed to send confirmation email: {e.detail}")
        # Optionally, re-raise a different HTTP error or return a specific message to the client
        # For simplicity here, we let the 201 CREATED stand but log the email error.

    return created_user


@router.get("/confirm-email/{token}", status_code=status.HTTP_200_OK, tags=["auth"])
def confirm_email(token: str, db: Session = Depends(get_session)):
    """
    Confirm user's email address using the provided token.
    """
    # Use the new CRUD function to get user by token
    user = crud.get_user_by_token(db, token=token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired confirmation token."
        )
    
    # Now update the user directly
    user.is_auth = True
    user.confirmation_token = None  # Clear the token once used
    user.confirmation_token_created_at = None # Clear the token creation date
    
    db.add(user)
    db.commit()
    
    # Return an HTML response that's more user-friendly
    html_content = """
    <!DOCTYPE html>
    <html>
        <head>
            <title>Email Confirmed</title>
            <meta http-equiv="refresh" content="5;url=http://localhost:5173/login">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .success { color: green; }
                .container { max-width: 600px; margin: 0 auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="success">Email Confirmed Successfully!</h1>
                <p>Your email has been confirmed. You can now log in to your account.</p>
                <p>Redirecting to login page in 5 seconds...</p>
                <p>If you are not redirected, <a href="http://localhost:5173/login">click here</a>.</p>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@router.post("/token", response_model=auth.Token, tags=["auth"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    """
    Authenticate user and return an access token.
    Takes form data with 'username' and 'password'.
    """
    # The 'username' field from OAuth2PasswordRequestForm will contain the email
    user = auth.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password", # Changed from "username"
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Regular users need email verification, but admins and owners don't
    if user.role not in [models.UserRole.admin, models.UserRole.owner] and not user.is_auth:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please confirm your email address to login."
        )

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    # The 'sub' claim in the token should be the user's email now
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

class TokenLoginData(BaseModel):
    token: str
    user_id: int

@router.post("/token/login-with-token", response_model=auth.Token, tags=["auth"])
def login_with_token(token_data: TokenLoginData, db: Session = Depends(get_session)):
    """
    Authenticate a user using a temporary token generated by an admin.
    """
    try:
        # Verify the token
        payload = jwt.decode(token_data.token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        
        # Extract data from token
        email = payload.get("sub")
        is_temp_login = payload.get("is_temp_login")
        user_id = payload.get("user_id")
        
        # Validate token data
        if not email or not is_temp_login or user_id != token_data.user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid login token"
            )
        
        # Get the user
        user = crud.get_user_by_email(db, email=email)
        if not user or user.id != token_data.user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or token mismatch"
            )
        
        # Create a regular access token
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/users/me", response_model=schemas.UserRead, tags=["users"])
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    """
    Get the details of the currently authenticated user.
    """
    return current_user

@router.put("/users/me", response_model=schemas.UserRead, tags=["users"])
def update_users_me(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Update the profile of the currently authenticated user.
    Users can only update their personal details, not their role, auth status, or email address.
    To change email address, a separate process with verification is required.
    """
    # Create a filtered version of the update data without role, is_auth, or email
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Remove fields that regular users shouldn't be able to change
    if 'role' in update_data:
        del update_data['role']
    if 'is_auth' in update_data:
        del update_data['is_auth']
    if 'email' in update_data:
        del update_data['email']
    
    # Create a new UserUpdate object with only the allowed fields
    filtered_update = schemas.UserUpdate(**update_data)
    
    # Update the user
    updated_user = crud.update_user(db=db, user_id=current_user.id, user_update=filtered_update)
    
    return updated_user

@router.get("/users/me/entries", response_model=list[schemas.JournalEntryRead], tags=["users"])
def read_users_entries(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get all journal entries for the currently authenticated user.
    """
    return crud.get_entries_by_user(db, user_id=current_user.id, skip=skip, limit=limit) 

@router.get("/users/me/referee-entries", response_model=list[schemas.JournalEntryRead], tags=["users"])
def read_users_referee_entries(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get all journal entries where the currently authenticated user is a referee.
    """
    return crud.get_entries_by_referee(db, user_id=current_user.id, skip=skip, limit=limit) 

@router.get("/users/me/edited-journals", response_model=list[models.Journal], tags=["users"])
def read_users_edited_journals(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get all journals where the currently authenticated user is an editor.
    """
    return crud.get_journals_by_editor(db, user_id=current_user.id, skip=skip, limit=limit) 

# Schema for forgot password request
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Schema for reset password request
class ResetPasswordRequest(BaseModel):
    password: str

@router.post("/forgot-password", status_code=status.HTTP_200_OK, tags=["auth"])
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_session)):
    """
    Request a password reset link via email.
    """
    # Create reset token for the user
    user = crud.create_password_reset_token(db, email=request.email)
    
    # Even if user doesn't exist, we return success for security reasons
    if not user:
        return {"message": "If the email is registered, a password reset link has been sent."}
    
    try:
        # Send reset password email
        base_url_for_email = "http://localhost:5173"  # Frontend URL
        send_password_reset_email(
            api_key=BREVO_API_KEY,
            user_email=user.email,
            user_name=user.name,
            reset_token=user.reset_password_token,
            base_url=base_url_for_email
        )
        return {"message": "Password reset link has been sent to your email."}
    except Exception as e:
        print(f"Failed to send password reset email to {user.email}: {e}")
        # For security, still return success even if email fails
        return {"message": "If the email is registered, a password reset link has been sent."}

@router.post("/reset-password/{token}", status_code=status.HTTP_200_OK, tags=["auth"])
def reset_password(token: str, request: ResetPasswordRequest, db: Session = Depends(get_session)):
    """
    Reset a user's password using a valid token.
    """
    # Get user by reset token
    user = crud.get_user_by_reset_token(db, token=token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
    
    # Check if token is expired (15 minutes)
    token_expiry = timedelta(minutes=15)
    if user.reset_password_token_created_at and datetime.utcnow() - user.reset_password_token_created_at > token_expiry:
        # Clear expired token
        user.reset_password_token = None
        user.reset_password_token_created_at = None
        db.add(user)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new reset link."
        )
    
    # Update the password
    crud.update_user_password(db, user.id, request.password)
    
    return {"message": "Password has been successfully reset. You can now log in with your new password."}

@router.get("/users/{user_id}/basic-info", response_model=schemas.UserRead, tags=["users"])
def get_user_basic_info(
    user_id: int,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Get basic information about a user by their ID.
    This endpoint is accessible to all authenticated users and provides
    the minimum necessary information for displaying user details in the UI.
    """
    # Get the requested user
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return the user's basic information
    return db_user 