-- Esquema de tabla 'users' para AXYNTRAX
-- Migrado de Replit (Helium) a Supabase

CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'agente',
  twofa_secret TEXT,
  twofa_enabled TEXT NOT NULL DEFAULT 'false',
  email_otp_hash TEXT,
  email_otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS (Opcional para admin, pero recomendado)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Solo administradores pueden ver todos los usuarios)
CREATE POLICY "Admin full access" ON public.users
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'axyntraxautomation@gmail.com');
