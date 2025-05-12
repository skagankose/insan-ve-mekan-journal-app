# Re-export models from models.py to be used as schemas
# This keeps API schema definitions consolidated

from .models import (
    User, UserCreate, UserRead, UserRole, UserUpdate,
    Journal, JournalCreate, JournalRead,
    JournalEntry, JournalEntryCreate, JournalEntryRead, JournalEntryUpdate
)

# You can add more specific API-only schemas here if needed later
# For example, schemas that combine data from multiple models 

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas

class UserBase(BaseModel):
    email: EmailStr
    name: str
    title: Optional[str] = None
    bio: Optional[str] = None
    telephone: Optional[str] = None
    science_branch: Optional[str] = None
    location: Optional[str] = None
    yoksis_id: Optional[str] = None
    orcid_id: Optional[str] = None
    role: Optional[str] = "author"
    is_auth: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    telephone: Optional[str] = None
    science_branch: Optional[str] = None
    location: Optional[str] = None
    yoksis_id: Optional[str] = None
    orcid_id: Optional[str] = None
    role: Optional[str] = None
    is_auth: Optional[bool] = None


class UserDelete(BaseModel):
    transfer_to_user_id: int


class TokenData(BaseModel):
    username: Optional[str] = None 