# Re-export models from models.py to be used as schemas
# This keeps API schema definitions consolidated

from .models import (
    User, UserCreate, UserRead, UserRole, UserUpdate,
    Journal, JournalCreate, JournalRead,
    JournalEntry, JournalEntryCreate, JournalEntryRead, JournalEntryUpdate
)

# You can add more specific API-only schemas here if needed later
# For example, schemas that combine data from multiple models 

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from enum import Enum
from datetime import datetime
import re

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
    recaptcha_token: str


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
    role: Optional[UserRole] = None
    is_auth: Optional[bool] = None
    marked_for_deletion: Optional[bool] = None
    tutorial_done: Optional[bool] = None


class UserDelete(BaseModel):
    transfer_to_user_id: int


class EditorInChiefUpdate(BaseModel):
    editor_in_chief_id: Optional[int] = None


class EditorAdd(BaseModel):
    user_id: int


class EntryUserAdd(BaseModel):
    user_id: int


class TokenData(BaseModel):
    username: Optional[str] = None


class SearchResults(BaseModel):
    """Schema for search results combining users, journals, and entries."""
    users: List[UserRead] = []
    journals: List[JournalRead] = []
    entries: List[JournalEntryRead] = []


class UserRead(UserBase):
    id: int
    role: UserRole
    is_auth: bool
    marked_for_deletion: bool = False
    tutorial_done: bool = False

# Define __all__ to explicitly export the schemas
__all__ = [
    'User', 'UserCreate', 'UserRead', 'UserRole', 'UserUpdate',
    'Journal', 'JournalCreate', 'JournalRead',
    'JournalEntry', 'JournalEntryCreate', 'JournalEntryRead', 'JournalEntryUpdate',
    'UserBase', 'UserDelete', 'EditorInChiefUpdate', 'EditorAdd', 'EntryUserAdd', 'TokenData',
    'SearchResults'
] 