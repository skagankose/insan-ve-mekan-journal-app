from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session
from pydantic import BaseModel

from . import crud, models, schemas, security
from .database import get_session

# This tells FastAPI where to look for the token (the '/token' endpoint we'll create)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

class Token(BaseModel):
    access_token: str
    token_type: str

def authenticate_user(db: Session, email: str, password: str) -> models.User | None:
    """Check if a user exists and the password is correct."""
    user = crud.get_user_by_email(db, email=email)
    if not user:
        return None
    if not security.verify_password(password, user.hashed_password):
        return None
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_session)) -> models.User:
    """Dependency to get the current user from a token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str | None = payload.get("sub") # "sub" is standard claim for subject (now using email)
        if email is None:
            raise credentials_exception
        token_data = security.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    """
    Dependency to get the current *active* user.
    (Currently just returns the user, but could add checks for is_active here).
    """
    # if not current_user.is_active: # Example check if you add an is_active field
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user 