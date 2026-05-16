-- ===============================================
-- MIGRACION AXYNTRAX A SUPABASE (POSTGRESQL)
-- Generado por Antigravity
-- ===============================================

-- 1. Activar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tablas Existentes (Migradas de SQLite)
CREATE TABLE IF NOT EXISTS public.usuarios (
    "id" BIGSERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BIGINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.clientes (
    "id" BIGSERIAL PRIMARY KEY,
    "empresa" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "ruc" TEXT,
    "ciudad" TEXT,
    "rubro" TEXT,
    "estado" TEXT DEFAULT 'Prospecto',
    "score" BIGINT DEFAULT 0,
    "puntos_lealtad" BIGINT DEFAULT 0,
    "categoria_vip" TEXT DEFAULT 'Bronce',
    "fecha_ultima_interaccion" TEXT,
    "fecha_nacimiento" TEXT,
    "fecha_aniversario" TEXT,
    "notas" TEXT,
    "usuario_id" BIGINT
);

CREATE TABLE IF NOT EXISTS public.licencias (
    "id" BIGSERIAL PRIMARY KEY,
    "clave" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dias" BIGINT NOT NULL,
    "cliente_id" BIGINT,
    "rubro" TEXT NOT NULL,
    "estado" TEXT DEFAULT 'Emitida',
    "fecha_inicio" TEXT,
    "fecha_fin" TEXT,
    "creado_por" BIGINT,
    "notas" TEXT
);

CREATE TABLE IF NOT EXISTS public.ventas (
    "id" BIGSERIAL PRIMARY KEY,
    "cliente_id" BIGINT,
    "licencia_id" BIGINT,
    "monto" NUMERIC NOT NULL,
    "etapa" TEXT DEFAULT 'Cierre',
    "estado" TEXT DEFAULT 'Completada',
    "metodo_pago" TEXT,
    "notas" TEXT,
    "usuario_id" BIGINT,
    "creado_en" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cobros (
    "id" BIGSERIAL PRIMARY KEY,
    "cliente_id" BIGINT,
    "venta_id" BIGINT,
    "monto" NUMERIC NOT NULL,
    "fecha_vencimiento" TEXT,
    "fecha_pago" TEXT,
    "estado" TEXT DEFAULT 'Pendiente',
    "metodo_pago" TEXT,
    "notas" TEXT
);

CREATE TABLE IF NOT EXISTS public.gastos (
    "id" BIGSERIAL PRIMARY KEY,
    "categoria" TEXT,
    "rubro" TEXT DEFAULT 'General',
    "descripcion" TEXT,
    "monto" NUMERIC,
    "fecha" TEXT DEFAULT NOW(),
    "usuario_id" BIGINT
);

CREATE TABLE IF NOT EXISTS public.logs (
    "id" BIGSERIAL PRIMARY KEY,
    "usuario_id" BIGINT,
    "accion" TEXT,
    "tabla" TEXT,
    "registro_id" BIGINT,
    "rubro" TEXT,
    "detalles" TEXT,
    "hash_actual" TEXT,
    "hash_previo" TEXT,
    "timestamp" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.axia_memory (
    "id" BIGSERIAL PRIMARY KEY,
    "cliente_id" BIGINT,
    "context" TEXT,
    "interaction_type" TEXT,
    "sentiment" TEXT,
    "timestamp" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.axia_autonomy_logs (
    "id" BIGSERIAL PRIMARY KEY,
    "modulo" TEXT,
    "decision" TEXT,
    "nivel_riesgo" TEXT,
    "resultado" TEXT,
    "timestamp" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.axia_patterns (
    "id" BIGSERIAL PRIMARY KEY,
    "entidad" TEXT,
    "patron_clave" TEXT,
    "peso" NUMERIC DEFAULT 1.0,
    "ultima_actualizacion" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.axia_notifications (
    "id" BIGSERIAL PRIMARY KEY,
    "entidad_id" BIGINT,
    "tipo_aviso" TEXT,
    "fecha_envio" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.axia_config (
    "key" TEXT PRIMARY KEY,
    "value" TEXT
);

CREATE TABLE IF NOT EXISTS public.axia_campaigns (
    "id" BIGSERIAL PRIMARY KEY,
    "fecha_programada" TEXT,
    "segmento" TEXT,
    "mensaje_raw" TEXT,
    "estado" TEXT DEFAULT 'Pendiente',
    "created_at" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.axia_marketing_logs (
    "id" BIGSERIAL PRIMARY KEY,
    "cliente_id" BIGINT,
    "campana_id" BIGINT,
    "fecha_envio" TEXT DEFAULT NOW(),
    "resultado" TEXT,
    "interaccion" TEXT
);

CREATE TABLE IF NOT EXISTS public.citas (
    "id" BIGSERIAL PRIMARY KEY,
    "cliente_id" BIGINT,
    "fecha_cita" TEXT,
    "asunto" TEXT,
    "ubicacion" TEXT,
    "resultado" TEXT DEFAULT 'Pendiente',
    "sync_provider" TEXT DEFAULT 'Local',
    "external_id" TEXT
);

CREATE TABLE IF NOT EXISTS public.axia_reports (
    "id" BIGSERIAL PRIMARY KEY,
    "tipo" TEXT,
    "nombre_archivo" TEXT,
    "ruta_archivo" TEXT,
    "fecha_generacion" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leads_v6 (
    "id" BIGSERIAL PRIMARY KEY,
    "source" TEXT,
    "score" BIGINT DEFAULT 0,
    "rubro" TEXT,
    "estado" TEXT DEFAULT 'Nuevo',
    "creado_en" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_followups (
    "id" BIGSERIAL PRIMARY KEY,
    "lead_id" BIGINT,
    "tipo_seguimiento" TEXT,
    "estado_envio" TEXT,
    "fecha_disparo" TEXT,
    "resultado_log" TEXT
);

CREATE TABLE IF NOT EXISTS public.bot_audit (
    "id" BIGSERIAL PRIMARY KEY,
    "bot_id" BIGINT,
    "action_type" TEXT,
    "result" TEXT,
    "details" TEXT,
    "rubro" TEXT,
    "tenant_id" TEXT,
    "hash_signature" TEXT,
    "timestamp" TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.res_config (
    "id" BIGSERIAL PRIMARY KEY,
    "nombre_condominio" TEXT DEFAULT 'AXYNTRAX RESIDENCIAL',
    "cta_principal" TEXT DEFAULT 'PAGAR MANTENIMIENTO',
    "logo_path" TEXT,
    "moneda" TEXT DEFAULT 'S/',
    "dia_cierre" BIGINT DEFAULT 1,
    "transparencia_activa" BIGINT DEFAULT 1
);

-- 3. Nuevas Tablas Requeridas para el Dashboard Gerencial

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT,
    master_key TEXT UNIQUE,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id),
    role TEXT DEFAULT 'worker',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modules (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0',
    description TEXT,
    download_path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kpis (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.price_list (
    id SERIAL PRIMARY KEY,
    plan_name TEXT NOT NULL,
    price_pen NUMERIC NOT NULL,
    benefits JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    

-- 4. Politicas de Seguridad Básicas (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;