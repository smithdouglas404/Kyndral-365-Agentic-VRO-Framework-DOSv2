-- Add Firebase UID column to users table for Firebase Authentication integration

-- Add firebaseUid column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE;

-- Create index on firebase_uid for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Add comment
COMMENT ON COLUMN users.firebase_uid IS 'Firebase Authentication UID for users authenticated via Firebase';
