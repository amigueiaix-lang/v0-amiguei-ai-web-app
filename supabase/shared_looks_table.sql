-- =====================================================
-- Amiguei.AI - Shared Looks System
-- =====================================================
-- Execute this SQL in your Supabase SQL Editor
-- This creates the shared_looks table for shareable look links

-- 1. Create shared_looks table
CREATE TABLE IF NOT EXISTS shared_looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code VARCHAR(12) NOT NULL UNIQUE,

  -- Look items (reference to closet_items)
  top_item_id UUID NOT NULL REFERENCES closet_items(id) ON DELETE CASCADE,
  bottom_item_id UUID NOT NULL REFERENCES closet_items(id) ON DELETE CASCADE,
  shoes_item_id UUID NOT NULL REFERENCES closet_items(id) ON DELETE CASCADE,

  -- AI reasoning
  reasoning TEXT NOT NULL,

  -- Quiz context (optional, to show what occasion/style this was for)
  occasion VARCHAR(100),
  style VARCHAR(100),
  climate VARCHAR(100),

  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shared_looks_user_id ON shared_looks(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_looks_share_code ON shared_looks(share_code);
CREATE INDEX IF NOT EXISTS idx_shared_looks_created_at ON shared_looks(created_at DESC);

-- 3. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_shared_looks_updated_at ON shared_looks;
CREATE TRIGGER update_shared_looks_updated_at
  BEFORE UPDATE ON shared_looks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE shared_looks ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies

-- Policy: Anyone can view shared looks (public sharing)
DROP POLICY IF EXISTS "Anyone can view shared looks" ON shared_looks;
CREATE POLICY "Anyone can view shared looks"
  ON shared_looks
  FOR SELECT
  USING (true);

-- Policy: Users can create shared looks
DROP POLICY IF EXISTS "Users can create shared looks" ON shared_looks;
CREATE POLICY "Users can create shared looks"
  ON shared_looks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own shared looks
DROP POLICY IF EXISTS "Users can update their own shared looks" ON shared_looks;
CREATE POLICY "Users can update their own shared looks"
  ON shared_looks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own shared looks
DROP POLICY IF EXISTS "Users can delete their own shared looks" ON shared_looks;
CREATE POLICY "Users can delete their own shared looks"
  ON shared_looks
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create function to generate unique share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES (run these to test)
-- =====================================================
-- Check if table was created correctly:
-- SELECT * FROM shared_looks;

-- Test share code generation:
-- SELECT generate_share_code();

-- Get all shared looks for current user:
-- SELECT * FROM shared_looks WHERE user_id = auth.uid() ORDER BY created_at DESC;
