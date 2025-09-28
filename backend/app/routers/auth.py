from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlmodel import Session
from datetime import timedelta, datetime
from sqlalchemy import select
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import logging

from .. import crud, schemas, models, auth, security
from ..database import get_session
from ..email_utils import send_confirmation_email, send_password_reset_email

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Your Brevo API Key - consider moving to environment variables for production
# BREVO_API_KEY = ""
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")
# RECAPTCHA_SECRET_KEY = ""
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Log configuration status
logger.info(f"Google Client ID configured: {'Yes' if GOOGLE_CLIENT_ID else 'No'}")
if not GOOGLE_CLIENT_ID:
    logger.warning("Google Client ID is not configured! Google Sign-In will not work.")

router = APIRouter()

async def verify_recaptcha(token: str) -> bool:
    """Verify reCAPTCHA token with Google's API"""
    if not RECAPTCHA_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="reCAPTCHA secret key not configured"
        )
    
    try:
        response = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={
                "secret": RECAPTCHA_SECRET_KEY,
                "response": token
            }
        )
        result = response.json()
        return result.get("success", False)
    except Exception as e:
        print(f"reCAPTCHA verification failed: {e}")
        return False

@router.post("/users/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED, tags=["auth"])
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_session)):
    """
    Register a new user and send a confirmation email.
    """
    # Skip reCAPTCHA verification for admin-created users (those with is_auth=True)
    if not user.is_auth and not await verify_recaptcha(user.recaptcha_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="reCAPTCHA verification failed"
        )

    print(f"Received user data for registration: {user.model_dump_json(indent=2)}")
    
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


@router.get("/confirm-email/{token}", response_class=RedirectResponse, tags=["auth"])
def confirm_email(token: str, db: Session = Depends(get_session)):
    """
    Confirm user's email address using the provided token and redirect to a frontend page.
    """
    user = crud.get_user_by_token(db, token=token)
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    if not user:
        # Redirect to a failure page on the frontend
        return RedirectResponse(url=f"{frontend_url}/email-confirmation?status=failed")
    
    # Now update the user directly
    user.is_auth = True
    user.confirmation_token = None  # Clear the token once used
    user.confirmation_token_created_at = None # Clear the token creation date
    
    db.add(user)
    db.commit()
    
    # Redirect to a success page on the frontend
    return RedirectResponse(url=f"{frontend_url}/email-confirmation?status=success")


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
    # Check if user exists first
    user = crud.get_user_by_email(db, email=request.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found with this email address."
        )
    
    # Create reset token for the user
    user_with_token = crud.create_password_reset_token(db, email=request.email)
    
    if not user_with_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create password reset token."
        )
    
    try:
        # Send reset password email
        base_url_for_email = "http://localhost:5173"  # Frontend URL
        send_password_reset_email(
            api_key=BREVO_API_KEY,
            user_email=user_with_token.email,
            user_name=user_with_token.name,
            reset_token=user_with_token.reset_password_token,
            base_url=base_url_for_email
        )
        return {"message": "Password reset link has been sent to your email."}
    except Exception as e:
        print(f"Failed to send password reset email to {user_with_token.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Şifre sıfırlama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyiniz."
        )

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
            detail="Bu sıfırlama linki kullanılmış veya süresi dolmuştur"
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

# Schema for change password request
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/users/me/change-password", status_code=status.HTTP_200_OK, tags=["auth"])
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Change the password of the currently authenticated user.
    Requires the current password for verification.
    """
    # Verify current password
    if not security.verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Update the password
    crud.update_user_password(db, current_user.id, request.new_password)
    
    return {"message": "Password has been successfully updated."}

class GoogleLoginData(BaseModel):
    credential: str

@router.post("/token/google", response_model=auth.Token, tags=["auth"])
async def login_with_google(data: GoogleLoginData, db: Session = Depends(get_session)):
    """
    Authenticate user with Google OAuth token and return an access token.
    """
    if not GOOGLE_CLIENT_ID:
        logger.error("Google OAuth is not configured - missing GOOGLE_CLIENT_ID")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on the server"
        )

    try:
        logger.info(f"Received Google credential, length: {len(data.credential)}")
        logger.info(f"Using Google Client ID: {GOOGLE_CLIENT_ID[:8]}...")  # Log only first 8 chars for security

        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )
        
        logger.info("Google token verified successfully")
        logger.debug(f"Token verification result: {idinfo}")  # Be careful with logging sensitive info

        # Get user info from the token
        email = idinfo.get('email')
        if not email:
            logger.error("No email found in Google token")
            raise ValueError("Email not found in token")
            
        name = idinfo.get('name', '')
        logger.info(f"Processing login for Google user: {email}")

        # Check if user exists
        user = crud.get_user_by_email(db, email=email)
        
        if not user:
            logger.info(f"Creating new user for Google account: {email}")
            # Create new user if doesn't exist
            user_data = schemas.UserCreate(
                email=email,
                name=name,
                password=security.get_random_string(32),  # Generate random password
                is_auth=True,  # Google-authenticated users are automatically verified
                recaptcha_token="google_oauth"  # Skip recaptcha for Google OAuth
            )
            user = crud.create_user(db, user_data)
            logger.info(f"New user created with ID: {user.id}")
        else:
            logger.info(f"Existing user found with ID: {user.id}")

        # Create access token
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        logger.info(f"Login successful for user: {email}")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        logger.error(f"Token verification failed with ValueError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Token verification failed with unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) 

@router.post("/resend-confirmation", status_code=status.HTTP_200_OK, tags=["auth"])
def resend_confirmation_email(request: ForgotPasswordRequest, db: Session = Depends(get_session)):
    """
    Resend a confirmation email to a user who hasn't confirmed their email yet.
    """
    # Check if user exists
    user = crud.get_user_by_email(db, email=request.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found with this email address."
        )
    
    # Check if user is already confirmed
    if user.is_auth:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already confirmed."
        )
    
    # Create a new confirmation token for the user
    user_with_token = crud.create_confirmation_token(db, email=request.email)
    
    if not user_with_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create confirmation token."
        )
    
    try:
        # Send confirmation email
        base_url_for_email = "http://localhost:8000"  # Backend URL
        send_confirmation_email(
            api_key=BREVO_API_KEY,
            user_email=user_with_token.email,
            user_name=user_with_token.name,
            confirmation_token=user_with_token.confirmation_token,
            base_url=base_url_for_email
        )
        return {"message": "Confirmation email has been sent to your email address."}
    except Exception as e:
        print(f"Failed to send confirmation email to {user_with_token.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send confirmation email. Please try again later."
        ) 
