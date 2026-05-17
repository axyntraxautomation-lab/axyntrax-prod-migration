-- Ejecutar en Supabase SQL Editor (proyecto de producción)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  whatsapp TEXT,
  plan TEXT CHECK (plan IN ('starter', 'pro', 'diamante')),
  demo_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '45 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER,
  status TEXT,
  stripe_payment_intent TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent);
