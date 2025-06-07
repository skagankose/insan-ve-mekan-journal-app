from datetime import datetime, timedelta
from typing import List, Optional, Literal
from enum import Enum
import random
import string
import pytz

from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Enum as SAEnum, Column, Text, JSON


class UserRole(str, Enum):
    author = "author"
    editor = "editor"
    referee = "referee"
    admin = "admin"
    owner = "owner"


# Journal Entry Type enumeration
class JournalEntryType(str, Enum):
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"


# Journal Entry Status enumeration
class JournalEntryStatus(str, Enum):
    WAITING_FOR_PAYMENT = "waiting_for_payment"
    WAITING_FOR_AUTHORS = "waiting_for_authors"
    WAITING_FOR_REFEREES = "waiting_for_referees"
    WAITING_FOR_EDITORS = "waiting_for_editors"
    ACCEPTED = "accepted"
    NOT_ACCEPTED = "not_accepted"


# Article Type enumeration
class ArticleType(str, Enum):
    THEORY = "theory"
    RESEARCH = "research"


# Article Language enumeration
class ArticleLanguage(str, Enum):
    TR = "tr"
    EN = "en"


# Define the association table for the many-to-many relationship
# between Journal and User (editors)
class JournalEditorLink(SQLModel, table=True):
    __tablename__ = "journal_editor_link"
    journal_id: Optional[int] = Field(
        default=None, foreign_key="journal.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="users.id", primary_key=True
    )


# Define the association table for the many-to-many relationship
# between JournalEntry and User (authors)
class JournalEntryAuthorLink(SQLModel, table=True):
    __tablename__ = "journal_entry_author_link"
    journal_entry_id: Optional[int] = Field(
        default=None, foreign_key="journalentry.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="users.id", primary_key=True
    )


# Define the association table for the many-to-many relationship
# between JournalEntry and User (referees)
class JournalEntryRefereeLink(SQLModel, table=True):
    __tablename__ = "journal_entry_referee_link"
    journal_entry_id: Optional[int] = Field(
        default=None, foreign_key="journalentry.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="users.id", primary_key=True
    )


# Define a base User model (without password for reading)
class UserBase(SQLModel):
    email: str = Field(unique=True)
    name: str
    title: Optional[str] = None
    bio: Optional[str] = None
    telephone: Optional[str] = None  # GSM number
    science_branch: Optional[str] = None  # Changed from Enum to simple string
    location: Optional[str] = None  # city/country
    yoksis_id: Optional[str] = None
    orcid_id: Optional[str] = None
    role: UserRole = Field(
        default=UserRole.author,
        sa_column=Column(SAEnum(
            UserRole,
            name="userrole",
            native_enum=True,
            use_enum_values=True,
            create_type=False
        ))
    )
    is_auth: bool = Field(default=False)


# Define the User model for database table creation
class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    confirmation_token: Optional[str] = Field(default=None, index=True, unique=True)
    confirmation_token_created_at: Optional[datetime] = Field(default=None)
    reset_password_token: Optional[str] = Field(default=None, index=True, unique=True)
    reset_password_token_created_at: Optional[datetime] = Field(default=None)
    tutorial_done: bool = Field(default=False)
    marked_for_deletion: bool = Field(default=False)

    chief_of_journals: List["Journal"] = Relationship(back_populates="editor_in_chief")
    editing_journals: List["Journal"] = Relationship(back_populates="editors", link_model=JournalEditorLink)
    authored_entries: List["JournalEntry"] = Relationship(back_populates="authors", link_model=JournalEntryAuthorLink)
    refereed_entries: List["JournalEntry"] = Relationship(back_populates="referees", link_model=JournalEntryRefereeLink)
    author_updates_made_by_user: List["AuthorUpdate"] = Relationship(back_populates="author")
    referee_updates_made_by_user: List["RefereeUpdate"] = Relationship(back_populates="referee")


# Define a User model for reading from API (excluding password)
class UserRead(UserBase):
    id: int
    marked_for_deletion: bool = Field(default=False)
    tutorial_done: bool = Field(default=False)


# Define a User model for creation (including password)
class UserCreate(UserBase):
    password: str


# Define a User model for updates (excluding password)
class UserUpdate(SQLModel):
    email: Optional[str] = None
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


# --------------------- Journal Models ---------------------

class JournalBase(SQLModel):
    title: str = Field(index=True)
    title_en: Optional[str] = Field(default="")
    created_date: datetime = Field(default_factory=lambda: datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None))
    issue: str
    is_published: bool = Field(default=False)
    publication_date: Optional[datetime] = Field(default=None)  # Manually set publication date
    publication_place: Optional[str] = None
    cover_photo: Optional[str] = None  # Path to cover photo file
    meta_files: Optional[str] = None  # Path to .pdf, .doc, or .docx file
    editor_notes: Optional[str] = None  # Path to .pdf, .doc, or .docx file
    full_pdf: Optional[str] = None  # Path to .pdf, .doc, or .docx file
    index_section: Optional[str] = None  # Path to .docx file
    file_path: Optional[str] = None  # Path to .docx file


# Define the Journal model for database table creation
class Journal(JournalBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    editor_in_chief_id: Optional[int] = Field(default=None, foreign_key="users.id")
    editor_in_chief: Optional["User"] = Relationship(back_populates="chief_of_journals")
    
    editors: List["User"] = Relationship(back_populates="editing_journals", link_model=JournalEditorLink)
    entries: List["JournalEntry"] = Relationship(back_populates="journal")


class JournalRead(JournalBase):
    id: int


class JournalCreate(SQLModel):
    title: str
    title_en: Optional[str] = ""
    issue: str
    is_published: bool = False
    publication_date: Optional[datetime] = None
    publication_place: Optional[str] = None
    cover_photo: Optional[str] = None
    meta_files: Optional[str] = None
    editor_notes: Optional[str] = None
    full_pdf: Optional[str] = None
    index_section: Optional[str] = None
    file_path: Optional[str] = None


class JournalUpdate(SQLModel):
    title: Optional[str] = None
    title_en: Optional[str] = None
    issue: Optional[str] = None
    created_date: Optional[datetime] = None
    is_published: Optional[bool] = None
    publication_date: Optional[datetime] = None
    publication_place: Optional[str] = None
    cover_photo: Optional[str] = None
    meta_files: Optional[str] = None
    editor_notes: Optional[str] = None
    full_pdf: Optional[str] = None
    index_section: Optional[str] = None
    file_path: Optional[str] = None


# --------------------- Journal Entry Models ---------------------

# Define a base JournalEntry model
class JournalEntryBase(SQLModel):
    title: str = Field(index=True)
    title_en: Optional[str] = Field(default="")
    created_date: datetime = Field(default_factory=lambda: datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None))
    publication_date: Optional[datetime] = Field(default=None)  # Manually set publication date
    abstract_tr: str
    abstract_en: Optional[str] = None
    keywords: Optional[str] = None
    page_number: Optional[str] = None
    article_type: Optional[str] = None
    language: Optional[str] = None
    doi: Optional[str] = None
    random_token: Optional[str] = None  # 8 random uppercase letters/numbers, prefixed with entry ID
    file_path: Optional[str] = None
    full_pdf: Optional[str] = None  # Path to .pdf file
    download_count: int = Field(default=0)
    read_count: int = Field(default=0)
    status: Optional[str] = None
    journal_id: Optional[int] = Field(default=None, foreign_key="journal.id")


# Define the JournalEntry model for database table creation
class JournalEntry(JournalEntryBase, table=True):
    __tablename__ = "journalentry"
    id: Optional[int] = Field(default=None, primary_key=True)

    journal: Optional[Journal] = Relationship(back_populates="entries")
    authors: List["User"] = Relationship(back_populates="authored_entries", link_model=JournalEntryAuthorLink)
    referees: List["User"] = Relationship(back_populates="refereed_entries", link_model=JournalEntryRefereeLink)
    
    author_updates: List["AuthorUpdate"] = Relationship(back_populates="entry")
    referee_updates: List["RefereeUpdate"] = Relationship(back_populates="entry")
    
    def generate_random_token(self):
        """Generate a random token that starts with the entry ID followed by 8 random uppercase letters/numbers."""
        if self.id is not None and not self.random_token:
            random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            self.random_token = f"{self.id}{random_chars}"
            return self.random_token
        return None


# Define a JournalEntry model for reading from API
class JournalEntryRead(JournalEntryBase):
    id: int
    authors: List[UserRead] = []
    referees: List[UserRead] = []


# Define a JournalEntry model for creation
class JournalEntryCreate(JournalEntryBase):
    authors_ids: Optional[List[int]] = None
    referees_ids: Optional[List[int]] = None


# Define a JournalEntry model for updating
class JournalEntryUpdate(SQLModel):
    title: Optional[str] = None
    title_en: Optional[str] = None
    created_date: Optional[datetime] = None
    abstract_tr: Optional[str] = None
    abstract_en: Optional[str] = None
    keywords: Optional[str] = None
    page_number: Optional[str] = None
    article_type: Optional[str] = None
    language: Optional[str] = None
    doi: Optional[str] = None
    file_path: Optional[str] = None
    download_count: Optional[int] = None
    read_count: Optional[int] = None
    status: Optional[str] = None
    authors_ids: Optional[List[int]] = None
    referees_ids: Optional[List[int]] = None
    journal_id: Optional[int] = None


# --------------------- Author Update Models ---------------------
class AuthorUpdateBase(SQLModel):
    title: Optional[str] = None
    abstract_en: Optional[str] = None
    abstract_tr: Optional[str] = None
    keywords: Optional[str] = None
    file_path: Optional[str] = None
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    created_date: datetime = Field(default_factory=lambda: datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None))

    entry_id: int = Field(foreign_key="journalentry.id")
    author_id: int = Field(foreign_key="users.id")


# Add this new schema for creation request body
class AuthorUpdateCreate(SQLModel):
    title: Optional[str] = None
    abstract_en: Optional[str] = Field(default=None, sa_column=Column(Text))
    abstract_tr: Optional[str] = Field(default=None, sa_column=Column(Text))
    keywords: Optional[str] = Field(default=None, sa_column=Column(Text))
    file_path: Optional[str] = None
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class AuthorUpdate(AuthorUpdateBase, table=True):
    __tablename__ = "author_updates"
    id: Optional[int] = Field(default=None, primary_key=True)

    entry: "JournalEntry" = Relationship(back_populates="author_updates")
    author: "User" = Relationship(back_populates="author_updates_made_by_user")


# --------------------- Referee Update Models ---------------------
class RefereeUpdateBase(SQLModel):
    file_path: Optional[str] = None
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    created_date: datetime = Field(default_factory=lambda: datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None))

    referee_id: int = Field(foreign_key="users.id")
    entry_id: int = Field(foreign_key="journalentry.id")


# Add this new schema for creation request body
class RefereeUpdateCreate(SQLModel):
    file_path: Optional[str] = None
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))


class RefereeUpdate(RefereeUpdateBase, table=True):
    __tablename__ = "referee_updates"
    id: Optional[int] = Field(default=None, primary_key=True)

    entry: "JournalEntry" = Relationship(back_populates="referee_updates")
    referee: "User" = Relationship(back_populates="referee_updates_made_by_user")


# --------------------- Application Settings Model ---------------------

# Define a base Settings model
class SettingsBase(SQLModel):
    active_journal_id: Optional[int] = Field(default=None, foreign_key="journal.id")
    about: Optional[str] = Field(default=None, max_length=5000)


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
    about: Optional[str] = None


# Link models now that they are all defined
User.update_forward_refs()
Journal.update_forward_refs()
JournalEntry.update_forward_refs()
AuthorUpdate.update_forward_refs()
RefereeUpdate.update_forward_refs()
# JournalEntryProgress.update_forward_refs() 