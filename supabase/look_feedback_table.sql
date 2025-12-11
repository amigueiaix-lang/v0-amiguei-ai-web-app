-- =====================================================
-- Amiguei.AI - Look Feedback System
-- =====================================================
-- Execute this SQL in your Supabase SQL Editor
-- This creates the look_feedback table to store user feedback on generated looks

-- 1. Create look_feedback table
CREATE TABLE IF NOT EXISTS look_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Look items that received feedback
  top_item_id UUID NOT NULL REFERENCES closet_items(id) ON DELETE CASCADE,
  bottom_item_id UUID NOT NULL REFERENCES closet_items(id) ON DELETE CASCADE,
  shoes_item_id UUID NOT NULL REFERENCES closet_items(id) ON DELETE CASCADE,

  -- Feedback type (what user didn't like)
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('colors', 'style', 'occasion', 'combination', 'other')),

  -- Context of the look when feedback was given
  occasion VARCHAR(100),
  climate VARCHAR(100),
  style VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_look_feedback_user_id ON look_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_look_feedback_feedback_type ON look_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_look_feedback_created_at ON look_feedback(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE look_feedback ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies

-- Policy: Users can view their own feedback
DROP POLICY IF EXISTS "Users can view their own feedback" ON look_feedback;
CREATE POLICY "Users can view their own feedback"
  ON look_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own feedback
DROP POLICY IF EXISTS "Users can insert their own feedback" ON look_feedback;
CREATE POLICY "Users can insert their own feedback"
  ON look_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can read all feedback (for analytics)
DROP POLICY IF EXISTS "Service role can read all feedback" ON look_feedback;
CREATE POLICY "Service role can read all feedback"
  ON look_feedback
  FOR SELECT
  USING (true);

-- =====================================================
-- VERIFICATION QUERIES (run these to test)
-- =====================================================
-- Check if table was created correctly:
-- SELECT * FROM look_feedback;

-- Get feedback stats:
-- SELECT feedback_type, COUNT(*) as count
-- FROM look_feedback
-- GROUP BY feedback_type
-- ORDER BY count DESC;

-- Get your own feedback:
-- SELECT * FROM look_feedback WHERE user_id = auth.uid() ORDER BY created_at DESC;
