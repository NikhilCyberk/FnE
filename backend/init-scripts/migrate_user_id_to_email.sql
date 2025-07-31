-- Migration script to update credit_cards table to use email as user_id
-- Run this script to update existing database schema

-- Step 1: Add a temporary column to store the new user_id (email)
ALTER TABLE credit_cards ADD COLUMN user_email TEXT;

-- Step 2: Update existing records with a default email (you should replace this with actual user emails)
-- For now, using a placeholder email for existing records
UPDATE credit_cards SET user_email = 'default@example.com' WHERE user_email IS NULL;

-- Step 3: Drop the old user_id column (foreign key constraint will be removed automatically)
ALTER TABLE credit_cards DROP COLUMN user_id;

-- Step 4: Rename user_email to user_id and make it NOT NULL
ALTER TABLE credit_cards RENAME COLUMN user_email TO user_id;
ALTER TABLE credit_cards ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Add a comment to clarify the column purpose
COMMENT ON COLUMN credit_cards.user_id IS 'Stores the user email address as the user identifier';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'credit_cards' AND column_name = 'user_id'; 