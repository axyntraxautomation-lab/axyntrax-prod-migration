-- =========================================================
-- SUPABASE MIGRATION: RLS Hardening Phase 1
-- Generado por Antigravity
-- Fecha: 2026-05-11
-- =========================================================

-- Enable RLS on verified tables (module_updates, clients, tasks skipped as they do not exist yet)
ALTER TABLE public.modules_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lockdown_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_events ENABLE ROW LEVEL SECURITY;

-- Dropping existing permissive policies
DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN 
        SELECT unnest(ARRAY['modules_catalog', 'payments', 'conversations', 'emails', 'finances', 'gmail_templates', 'licenses', 'lockdown_state', 'messages', 'module_events'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public Access All" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view their own" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Select own data" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Insert own data" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Update own data" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Delete own data" ON public.%I', tbl_name);
    END LOOP;
END $$;

-- =========================================================
-- 1. REGULAR USER DATA TABLES (Owner only access via client_id)
-- =========================================================

DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN 
        SELECT unnest(ARRAY['conversations', 'emails', 'finances', 'module_events', 'payments'])
    LOOP
        EXECUTE format('
            CREATE POLICY "Select own data" ON public.%I FOR SELECT USING (auth.uid()::text = client_id::text);
            CREATE POLICY "Insert own data" ON public.%I FOR INSERT WITH CHECK (auth.uid()::text = client_id::text);
            CREATE POLICY "Update own data" ON public.%I FOR UPDATE USING (auth.uid()::text = client_id::text);
            CREATE POLICY "Delete own data" ON public.%I FOR DELETE USING (auth.uid()::text = client_id::text);
        ', tbl_name, tbl_name, tbl_name, tbl_name);
    END LOOP;
END $$;


-- =========================================================
-- 2. CONFIGURATION / READ-ONLY TABLES (Public Read, Admin Write)
-- =========================================================
-- NOTE: Assuming Admin is identified via user claim or simply restricting to specific UID if exists.
-- By default, if no complex role exists, setting to authenticated insert/update/delete is safer than public.

DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN 
        SELECT unnest(ARRAY['modules_catalog', 'gmail_templates', 'licenses'])
    LOOP
        EXECUTE format('
            CREATE POLICY "Public read access" ON public.%I
            FOR SELECT USING (true);
            
            CREATE POLICY "Admin write access" ON public.%I
            FOR ALL TO authenticated
            USING ((SELECT auth.jwt() ->> ''role'') = ''admin'');
        ', tbl_name, tbl_name);
    END LOOP;
END $$;

-- Notification to System
COMMENT ON SCHEMA public IS 'RLS Hardening applied on 2026-05-11';
