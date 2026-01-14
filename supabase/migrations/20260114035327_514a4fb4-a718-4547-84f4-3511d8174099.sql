-- Add foreign key constraint between payment_history and subscriptions
ALTER TABLE payment_history
ADD CONSTRAINT fk_payment_subscription
FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Add new columns to payment_history for detailed payment metadata
ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_method_details jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bank_reference text,
ADD COLUMN IF NOT EXISTS refund_id text,
ADD COLUMN IF NOT EXISTS refund_amount numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
ADD COLUMN IF NOT EXISTS failure_reason text,
ADD COLUMN IF NOT EXISTS notes jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ip_address text;

-- Create payment_events table for webhook tracking
CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_history_id uuid REFERENCES payment_history(id) ON DELETE CASCADE,
  razorpay_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on payment_events
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_events (users can view their own payment events)
CREATE POLICY "Users can view their own payment events"
ON payment_events FOR SELECT
USING (
  payment_history_id IN (
    SELECT id FROM payment_history WHERE user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_history ON payment_events(payment_history_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON payment_events(event_type);