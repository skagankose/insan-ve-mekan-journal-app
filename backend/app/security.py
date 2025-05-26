import os
import secrets
import string
from datetime import datetime, timedelta
from typing import Any, Union, Optional

from jose import jwt, JWTError
import bcrypt  # Replace passlib with bcrypt
from dotenv import load_dotenv
from pydantic import BaseModel
from passlib.context import CryptContext

# Load environment variables from .env file
load_dotenv()

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password Hashing --- 

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Convert passwords to bytes
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    # Verify the password
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_password_hash(password: str) -> str:
    # Convert the password to bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return the hash as a string
    return hashed.decode('utf-8')


def get_random_string(length: int) -> str:
    """Generate a random string of specified length."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# --- JWT Token Handling --- 

# Configuration from environment variables (add these to your .env file!)
SECRET_KEY = os.getenv("SECRET_KEY", "your_default_secret_key_here_if_not_set") # Keep secret! Default is insecure.
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 43200))

# Pydantic model for token data (the payload/claims)
class TokenData(BaseModel):
    email: Optional[str] = None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt 