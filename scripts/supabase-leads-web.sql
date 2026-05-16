-- =============================================================================
-- Supabase: public.leads + RLS (web Vercel)
-- -----------------------------------------------------------------------------
-- Vercel → SUPABASE_URL, SUPABASE_ANON_KEY (Project Settings → API).
-- POST /api/registro-demo usa solo REST + anon key (sin SQLite).
--
-- RLS: anon → INSERT sí; SELECT anon no (sin política SELECT para anon).
--      authenticated → SELECT sí (panel / usuarios logueados).
-- Ejecutar en SQL Editor (una vez o tras cambios de políticas).
-- =============================================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  whatsapp text not null,
  email text,
  empresa text,
  rubro text,
  fecha timestamptz not null default now(),
  acepta_terminos boolean not null default false,
  acepta_marketing boolean not null default false,
  timestamp_consentimiento timestamptz,
  version_terminos text,
  origen text default 'web_axyntrax',
  estado text default 'nuevo'
);

-- Si la tabla ya existía sin columnas nuevas:
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists empresa text;
alter table public.leads add column if not exists rubro text;
alter table public.leads add column if not exists acepta_terminos boolean default false;
alter table public.leads add column if not exists acepta_marketing boolean default false;
alter table public.leads add column if not exists timestamp_consentimiento timestamptz;
alter table public.leads add column if not exists version_terminos text;
alter table public.leads add column if not exists origen text default 'web_axyntrax';
alter table public.leads add column if not exists estado text default 'nuevo';

alter table public.leads enable row level security;

-- Anon: solo INSERT (sin lectura ni escritura extra)
revoke all on table public.leads from anon;
grant insert on table public.leads to anon;

drop policy if exists "anon_insert_leads" on public.leads;
create policy "anon_insert_leads"
  on public.leads for insert
  to anon
  with check (true);

-- Sin política SELECT para anon ⇒ anon no puede leer filas

-- Panel interno / service role: lectura con rol authenticated (opcional)
drop policy if exists "authenticated_select_leads" on public.leads;
create policy "authenticated_select_leads"
  on public.leads for select
  to authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on table public.leads to authenticated;
