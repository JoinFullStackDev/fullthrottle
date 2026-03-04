ALTER TABLE profiles ADD COLUMN invited_at timestamptz;
ALTER TABLE profiles ADD COLUMN onboarded_at timestamptz;

UPDATE profiles SET onboarded_at = created_at WHERE onboarded_at IS NULL;
