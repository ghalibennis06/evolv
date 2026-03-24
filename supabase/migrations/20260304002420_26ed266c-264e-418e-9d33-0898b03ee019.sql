
-- Add columns to packs table
ALTER TABLE packs
  ADD COLUMN IF NOT EXISTS pack_type text DEFAULT 'carte_black',
  ADD COLUMN IF NOT EXISTS created_by text DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create pack_usage_log table
CREATE TABLE IF NOT EXISTS pack_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES packs(id) ON DELETE CASCADE,
  pack_code text NOT NULL,
  session_id uuid REFERENCES sessions(id),
  session_title text,
  session_date date,
  session_time text,
  used_at timestamptz DEFAULT now(),
  used_by_name text,
  used_by_phone text,
  cancelled_at timestamptz,
  cancellation_reason text,
  credit_refunded boolean DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_packs_code ON packs(pack_code);
CREATE INDEX IF NOT EXISTS idx_packs_email ON packs(client_email);
CREATE INDEX IF NOT EXISTS idx_usage_pack_id ON pack_usage_log(pack_id);
CREATE INDEX IF NOT EXISTS idx_usage_date ON pack_usage_log(used_at);

-- RLS
ALTER TABLE pack_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view usage log" ON pack_usage_log FOR SELECT USING (true);

-- Add SELECT policy on packs (currently missing)
CREATE POLICY "Anyone can view packs" ON packs FOR SELECT USING (true);
