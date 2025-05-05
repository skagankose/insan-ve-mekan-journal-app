# Re-export models from models.py to be used as schemas
# This keeps API schema definitions consolidated

from .models import (
    User, UserCreate, UserRead, UserRole,
    Journal, JournalCreate, JournalRead,
    JournalEntry, JournalEntryCreate, JournalEntryRead, JournalEntryUpdate
)

# You can add more specific API-only schemas here if needed later
# For example, schemas that combine data from multiple models 