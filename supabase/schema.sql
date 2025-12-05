-- =====================================================
-- Amiguei.AI - User Credits (Coins) System
-- =====================================================
-- Execute this SQL in your Supabase SQL Editor
-- This creates the user_credits table and related functions

-- 1. Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 3 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- 3. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Create function to initialize user credits on signup
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance)
  VALUES (NEW.id, 3)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to auto-initialize credits when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_credits();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
-- Policy: Users can view their own credits
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
CREATE POLICY "Users can view their own credits"
  ON user_credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own credits (for deduction/addition)
DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
CREATE POLICY "Users can update their own credits"
  ON user_credits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can insert credits (for initial setup)
DROP POLICY IF EXISTS "Service role can insert credits" ON user_credits;
CREATE POLICY "Service role can insert credits"
  ON user_credits
  FOR INSERT
  WITH CHECK (true);

-- 9. Create transactions table for coin purchase history (optional, for future payment integration)
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'deduction', 'bonus', 'refund')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);

-- Enable RLS for transactions
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON coin_transactions;
CREATE POLICY "Users can view their own transactions"
  ON coin_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES (run these to test)
-- =====================================================
-- Check if table was created correctly:
-- SELECT * FROM user_credits;

-- Check your own balance:
-- SELECT * FROM user_credits WHERE user_id = auth.uid();

-- Check transaction history:
-- SELECT * FROM coin_transactions WHERE user_id = auth.uid() ORDER BY created_at DESC;
