from datetime import datetime
from typing import List, Optional, Literal
from enum import Enum

from sqlmodel import Field, Relationship, SQLModel


class UserRole(str, Enum):
    WRITER = "writer"
    EDITOR = "editor"  
    ARBITRATOR = "arbitrator"
    ADMIN = "admin"


# Journal Entry Type enumeration
class JournalEntryType(str, Enum):
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"


# Journal Entry Status enumeration
class JournalEntryStatus(str, Enum):
    WAITING_FOR_PAYMENT = "waiting_for_payment"
    WAITING_FOR_WRITER = "waiting_for_writer"
    WAITING_FOR_ARBITRATOR = "waiting_for_arbitrator"
    WAITING_FOR_EDITOR = "waiting_for_editor"
    COMPLETED = "completed"


# Define a base User model (without password for reading)
class UserBase(SQLModel):
    username: str = Field(index=True, unique=True)
    email: str = Field(unique=True)
    name: str
    title: Optional[str] = None
    bio: Optional[str] = None
    role: UserRole = Field(default=UserRole.WRITER)
    is_auth: bool = Field(default=False)


# Define the User model for database table creation
class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    confirmation_token: Optional[str] = Field(default=None, index=True, unique=True)
    confirmation_token_created_at: Optional[datetime] = Field(default=None)

    entries: List["JournalEntry"] = Relationship(back_populates="owner")


# Define a User model for reading from API (excluding password)
class UserRead(UserBase):
    id: int


# Define a User model for creation (including password)
class UserCreate(UserBase):
    password: str


# --------------------- Journal Models ---------------------

class JournalBase(SQLModel):
    title: str = Field(index=True)
    date: datetime = Field(default_factory=datetime.utcnow)
    issue: str


# Define the Journal model for database table creation
class Journal(JournalBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    entries: List["JournalEntry"] = Relationship(back_populates="journal")


class JournalRead(JournalBase):
    id: int


class JournalCreate(JournalBase):
    pass


# --------------------- Journal Entry Models ---------------------

# Define a base JournalEntry model
class JournalEntryBase(SQLModel):
    title: str = Field(index=True)
    date: datetime = Field(default_factory=datetime.utcnow)
    abstract: str
    content: str
    file_path: Optional[str] = None  # Path to uploaded file
    status: JournalEntryStatus = Field(default=JournalEntryStatus.WAITING_FOR_PAYMENT)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    owner_id: Optional[int] = Field(default=None, foreign_key="users.id")
    journal_id: Optional[int] = Field(default=None, foreign_key="journal.id")


# Define the JournalEntry model for database table creation
class JournalEntry(JournalEntryBase, table=True):
    __tablename__ = "journalentry"
    id: Optional[int] = Field(default=None, primary_key=True)

    owner: Optional[User] = Relationship(back_populates="entries")
    journal: Optional[Journal] = Relationship(back_populates="entries")
    progress_records: List["JournalEntryProgress"] = Relationship(back_populates="journal_entry")


# Define a JournalEntry model for reading from API
class JournalEntryRead(JournalEntryBase):
    id: int


# Define a JournalEntry model for creation
class JournalEntryCreate(JournalEntryBase):
    journal_id: Optional[int] = None
    pass


# Define a JournalEntry model for updating
class JournalEntryUpdate(SQLModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    content: Optional[str] = None
    file_path: Optional[str] = None


# --------------------- Journal Entry Progress Models ---------------------

# Define a base JournalEntryProgress model
class JournalEntryProgressBase(SQLModel):
    title: str = Field(index=True)
    date: datetime = Field(default_factory=datetime.utcnow)
    abstract: str
    content: str
    file_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    
    owner_id: Optional[int] = Field(default=None, foreign_key="users.id")
    owner_role: UserRole
    journal_entry_id: int = Field(foreign_key="journalentry.id")


# Define the JournalEntryProgress model for database table creation
class JournalEntryProgress(JournalEntryProgressBase, table=True):
    __tablename__ = "journalentryprogress"
    id: Optional[int] = Field(default=None, primary_key=True)
    
    journal_entry: JournalEntry = Relationship(back_populates="progress_records")


# Define a JournalEntryProgress model for reading from API
class JournalEntryProgressRead(JournalEntryProgressBase):
    id: int


# Define a JournalEntryProgress model for creation
class JournalEntryProgressCreate(JournalEntryProgressBase):
    pass


# --------------------- Application Settings Model ---------------------

# Define a base Settings model
class SettingsBase(SQLModel):
    active_journal_id: Optional[int] = Field(default=None, foreign_key="journal.id")


# Define the Settings model for database table creation
class Settings(SettingsBase, table=True):
    __tablename__ = "settings"
    id: int = Field(default=1, primary_key=True)  # Single row with ID 1


# Define a Settings model for reading from API
class SettingsRead(SettingsBase):
    id: int


# Define a Settings model for updating
class SettingsUpdate(SQLModel):
    active_journal_id: Optional[int] = None


# Link models now that they are all defined
User.update_forward_refs()
Journal.update_forward_refs()
JournalEntry.update_forward_refs()
JournalEntryProgress.update_forward_refs() 