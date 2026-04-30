-- Add opening_hours column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Add updated_at column to reviews table if it doesn't exist
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Update existing vendors with default opening hours (Mon-Sat 10:00-21:00, Sun closed)
UPDATE vendors 
SET opening_hours = '{
  "Mon": {"open": "10:00", "close": "21:00"},
  "Tue": {"open": "10:00", "close": "21:00"},
  "Wed": {"open": "10:00", "close": "21:00"},
  "Thu": {"open": "10:00", "close": "21:00"},
  "Fri": {"open": "10:00", "close": "21:00"},
  "Sat": {"open": "10:00", "close": "21:00"},
  "Sun": {"open": "10:00", "close": "18:00"}
}'::jsonb
WHERE opening_hours IS NULL;
