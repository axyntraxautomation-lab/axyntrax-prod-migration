-- Crear tabla de leads si no existe
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    nombre TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    sector TEXT,
    necesidad TEXT,
    origen TEXT DEFAULT 'web',
    estado TEXT DEFAULT 'nuevo' -- nuevo, contactado, demo_programada, cliente
);

-- Habilitar Row Level Security (opcional, pero recomendado)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir inserciones anónimas (para el form web)
CREATE POLICY "Permitir inserciones desde la web" 
ON leads FOR INSERT 
WITH CHECK (true);

-- Crear política para que solo el admin vea los leads
-- Nota: Esto asume que el admin usa su cuenta de Supabase
CREATE POLICY "Solo admins ven leads" 
ON leads FOR SELECT 
USING (auth.role() = 'authenticated');
