-- Rename the user table to users
ALTER TABLE "user" RENAME TO users;

-- Update sequence names (assuming PostgreSQL default naming)
ALTER SEQUENCE IF EXISTS user_id_seq RENAME TO users_id_seq;

-- Update foreign key constraints pointing to user table
ALTER TABLE journal_entry 
    DROP CONSTRAINT IF EXISTS journal_entry_owner_id_fkey,
    ADD CONSTRAINT journal_entry_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES users(id);

-- Display changes for verification
SELECT tablename FROM pg_tables WHERE schemaname = 'public'; 