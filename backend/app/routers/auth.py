from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlmodel import Session
from datetime import timedelta
from sqlalchemy import select

from .. import crud, schemas, models, auth, security
from ..database import get_session
from ..email_utils import send_confirmation_email

# Your Brevo API Key - consider moving to environment variables for production
BREVO_API_KEY = "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"

router = APIRouter()

@router.post("/users/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED, tags=["auth"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_session)):
    """
    Register a new user and send a confirmation email.
    """
    db_user_by_username = crud.get_user_by_username(db, username=user.username)
    if db_user_by_username:
        raise HTTPException(status_code=400, detail="Username already registered")
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
        print(f"User {created_user.username} created, but failed to send confirmation email: {e.detail}")
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
    user = auth.authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is authenticated via email, unless they are an admin
    if user.role != models.UserRole.ADMIN and not user.is_auth:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please confirm your email address to login.",
        )

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=schemas.UserRead, tags=["users"])
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    """
    Get the details of the currently authenticated user.
    """
    return current_user 